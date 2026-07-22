//  server/src/models/conversation.model.ts

import mongoose, { Schema } from 'mongoose';
import { IConversationDocument } from '../types/conversation.types.js';

const conversationSchema = new Schema<IConversationDocument>(
  {
    pairKey: { type: String, unique: true },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: true,
      validate: {
        validator: (arr: unknown[]) => arr.length === 2,
        message: 'A conversation must have exactly 2 participants',
      },
    },
    lastMessage: {
      text: { type: String },
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date },
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model<IConversationDocument>('Conversation', conversationSchema);
export default Conversation;
