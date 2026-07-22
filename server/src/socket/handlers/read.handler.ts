// server/src/socket/handlers/read.handler.ts

import { Socket } from 'socket.io';
import mongoose from 'mongoose';
import Message from '../../models/message.model.js';
import Conversation from '../../models/conversation.model.js';
import { MessageStatus } from '../../types/message.types.js';
import { IUserDocument } from '../../types/user.types.js';

export async function handleMarkRead(
  socket: Socket,
  data: { conversationId: string },
  ack: (response: { success: boolean }) => void,
): Promise<void> {
  try {
    const user = socket.data.user as IUserDocument;
    if (!user) {
      ack({ success: false });
      return;
    }

    const { conversationId } = data;
    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      ack({ success: false });
      return;
    }

    const userId = user._id.toString();

    // Fetch conversation and verify caller is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      ack({ success: false });
      return;
    }

    if (!conversation.participants.some((p) => p.toString() === userId)) {
      ack({ success: false });
      return;
    }

    // Reset unreadCount for this user
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { [`unreadCount.${userId}`]: 0 },
    });

    const otherParticipant = conversation.participants.find((p) => p.toString() !== userId);
    if (otherParticipant) {
      await Message.updateMany(
        {
          senderId: otherParticipant,
          receiverId: user._id,
          status: { $ne: MessageStatus.Read },
        },
        { $set: { status: MessageStatus.Read } },
      );
    }

    ack({ success: true });
  } catch (error) {
    console.error('Error handling mark_read:', error);
    ack({ success: false });
  }
}
