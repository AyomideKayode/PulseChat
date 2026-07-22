// server/src/socket/presence.ts

import { Socket } from 'socket.io';

const presenceMap = new Map<string, Set<string>>();

export function addSocket(userId: string, socketId: string): boolean {
  const sockets = presenceMap.get(userId);
  if (sockets) {
    sockets.add(socketId);
    return false;
  }
  presenceMap.set(userId, new Set([socketId]));
  return true;
}

export function removeSocket(userId: string, socketId: string): boolean {
  const sockets = presenceMap.get(userId);
  if (!sockets) return false;

  sockets.delete(socketId);
  if (sockets.size === 0) {
    presenceMap.delete(userId);
    return true;
  }
  return false;
}

export function isUserOnline(userId: string): boolean {
  const sockets = presenceMap.get(userId);
  return sockets !== undefined && sockets.size > 0;
}
