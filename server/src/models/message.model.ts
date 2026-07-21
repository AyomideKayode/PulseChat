// server/src/models/message.model.ts

import mongoose, { Schema } from 'mongoose'
import { IMessageDocument, MessageStatus } from '../types/message.types.js'

const messageSchema = new Schema<IMessageDocument>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    image: { type: String },
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.Sent,
    },
  },
  { timestamps: true },
)

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 })

const Message = mongoose.model<IMessageDocument>('Message', messageSchema)
export default Message
