// server/src/socket/index.ts

import { Server, Socket } from 'socket.io';
import { authenticateSocket } from './auth.js';
import { addSocket, removeSocket, isUserOnline } from './presence.js';
import { handleSendMessage } from './handlers/message.handler.js';
import { handleTypingStart, handleTypingStop } from './handlers/typing.handler.js';
import { handleMarkRead } from './handlers/read.handler.js';
import { IUserDocument } from '../types/user.types.js';

export function setupSocket(io: Server): void {
  io.use(async (socket: Socket, next) => {
    await authenticateSocket(socket);
    if (!socket.data.user) {
      return next(new Error('Authentication failed'));
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as IUserDocument;
    const userId = user._id.toString();

    const justCameOnline = addSocket(userId, socket.id);
    socket.join(`user:${userId}`);

    if (justCameOnline) {
      io.emit('user_online', { userId });
    }

    socket.on('send_message', (data, ack) => {
      handleSendMessage(socket, data, ack);
    });

    socket.on('typing_start', (data) => {
      handleTypingStart(socket, data);
    });

    socket.on('typing_stop', (data) => {
      handleTypingStop(socket, data);
    });

    socket.on('mark_read', (data, ack) => {
      handleMarkRead(socket, data, ack);
    });

    socket.on('disconnect', () => {
      const goneOffline = removeSocket(userId, socket.id);
      socket.leave(`user:${userId}`);

      if (goneOffline) {
        io.emit('user_offline', { userId });
      }
    });
  });
}
