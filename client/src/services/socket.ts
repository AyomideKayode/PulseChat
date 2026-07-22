import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/socket-events.types';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(): TypedSocket {
  return io('/', {
    withCredentials: true,
    autoConnect: false,
  });
}
