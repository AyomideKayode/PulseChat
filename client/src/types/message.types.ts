export enum MessageStatus {
  Sent = 'sent',
  Delivered = 'delivered',
  Read = 'read',
}

export interface IMessage {
  _id: string;
  senderId:
    | { _id: string; fullName: string; email: string; profilePicture: { url: string; publicId: string } }
    | string;
  receiverId:
    | { _id: string; fullName: string; email: string; profilePicture: { url: string; publicId: string } }
    | string;
  text?: string;
  image?: string;
  status: MessageStatus;
  isOptimistic?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IConversation {
  _id: string;
  participants: Array<{
    _id: string;
    fullName: string;
    email: string;
    profilePicture: { url: string; publicId: string };
  }>;
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessagePayload {
  receiverId: string;
  text?: string;
  image?: string;
}
