// server/src/socket/handlers/typing.handler.ts

import { Socket } from 'socket.io';

export function handleTypingStart(socket: Socket, data: { receiverId: string }): void {
  const { receiverId } = data;
  if (!receiverId) return;

  socket
    .to(`user:${receiverId}`)
    .emit('typing_start', { userId: socket.data.user?._id.toString() });
}

export function handleTypingStop(socket: Socket, data: { receiverId: string }): void {
  const { receiverId } = data;
  if (!receiverId) return;

  socket.to(`user:${receiverId}`).emit('typing_stop', { userId: socket.data.user?._id.toString() });
}
