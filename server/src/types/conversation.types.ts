// server/src/types/conversation.types.ts

import { Document, Types } from 'mongoose';

export interface IConversation {
  pairKey: string;
  participants: [Types.ObjectId, Types.ObjectId];
  lastMessage?: {
    text: string;
    senderId: Types.ObjectId;
    createdAt: Date;
  };
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversationDocument extends IConversation, Document {}
