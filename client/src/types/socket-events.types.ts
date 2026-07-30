import type { IMessage } from './message.types';

export interface ServerToClientEvents {
  new_message: (message: IMessage) => void;
  user_online: (data: { userId: string }) => void;
  user_offline: (data: { userId: string }) => void;
  typing_start: (data: { userId: string }) => void;
  typing_stop: (data: { userId: string }) => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  send_message: (
    data: { receiverId: string; text?: string; image?: string },
    ack: (response: { success: boolean; message?: IMessage; error?: string }) => void,
  ) => void;
  mark_read: (
    data: { conversationId: string },
    ack: (response: { success: boolean }) => void,
  ) => void;
  typing_start: (data: { receiverId: string }) => void;
  typing_stop: (data: { receiverId: string }) => void;
}
