// server/src/socket/handlers/message.handler.ts

import { Socket } from 'socket.io';
import mongoose from 'mongoose';
import Message from '../../models/message.model.js';
import Conversation from '../../models/conversation.model.js';
import { MessageStatus, IMessage } from '../../types/message.types.js';
import { IUserDocument } from '../../types/user.types.js';

const messageRateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 10_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = messageRateMap.get(userId);
  if (!entry || now > entry.resetAt) {
    messageRateMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function handleSendMessage(
  socket: Socket,
  data: { receiverId: string; text?: string; image?: string },
  ack: (response: { success: boolean; message?: IMessage; error?: string }) => void,
): Promise<void> {
  try {
    const user = socket.data.user as IUserDocument;
    if (!user) {
      ack({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!checkRateLimit(user._id.toString())) {
      ack({ success: false, error: 'Rate limit exceeded' });
      return;
    }

    const { receiverId, text, image } = data;

    if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
      ack({ success: false, error: 'Invalid receiver ID' });
      return;
    }

    if (!text?.trim() && !image) {
      ack({ success: false, error: 'Message text or image is required' });
      return;
    }

    if (text && text.length > 2000) {
      ack({ success: false, error: 'Message exceeds 2000 characters' });
      return;
    }

    if (image && (typeof image !== 'string' || image.length > 2048)) {
      ack({ success: false, error: 'Invalid image reference' });
      return;
    }

    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);
    const senderObjectId = new mongoose.Types.ObjectId(user._id.toString());

    const message = await Message.create({
      senderId: senderObjectId,
      receiverId: receiverObjectId,
      text: text?.trim(),
      image,
      status: MessageStatus.Sent,
    });

    const populatedMessage = await message.populate([
      { path: 'senderId', select: 'fullName email profilePicture' },
      { path: 'receiverId', select: 'fullName email profilePicture' },
    ]);

    const messageJson = populatedMessage.toObject() as unknown as IMessage;

    // Upsert conversation by unique pairKey (prevents duplicates)
    const participantIds = [senderObjectId, receiverObjectId].sort((a, b) =>
      a.toString().localeCompare(b.toString()),
    );
    const pairKey = participantIds.map((id) => id.toString()).join(':');

    try {
      await Conversation.findOneAndUpdate(
        { pairKey },
        {
          $setOnInsert: { participants: participantIds, pairKey },
          $set: {
            lastMessage: {
              text: text?.trim() || '[Image]',
              senderId: senderObjectId,
              createdAt: message.createdAt,
            },
          },
          $inc: { [`unreadCount.${receiverId}`]: 1 },
        },
        { upsert: true },
      );
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 11000) {
        await Conversation.findOneAndUpdate(
          { pairKey },
          {
            $set: {
              lastMessage: {
                text: text?.trim() || '[Image]',
                senderId: senderObjectId,
                createdAt: message.createdAt,
              },
            },
            $inc: { [`unreadCount.${receiverId}`]: 1 },
          },
        );
      } else {
        throw err;
      }
    }

    // Emit to receiver's room and all of the sender's sockets
    socket.to(`user:${receiverId}`).emit('new_message', messageJson);
    socket.to(`user:${user._id.toString()}`).emit('new_message', messageJson);
    socket.emit('new_message', messageJson);

    ack({ success: true, message: messageJson });
  } catch (error) {
    console.error('Error handling send_message:', error);
    ack({ success: false, error: 'Internal server error' });
  }
}
