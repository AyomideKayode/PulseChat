// server/src/types/message.types.ts

import { Document, Types } from 'mongoose'

export enum MessageStatus {
  Sent = 'sent',
  Delivered = 'delivered',
  Read = 'read',
}

export interface IMessage {
  senderId: Types.ObjectId
  receiverId: Types.ObjectId
  text?: string
  image?: string
  status: MessageStatus
  createdAt: Date
  updatedAt: Date
}

export interface IMessageDocument extends IMessage, Document {}

export interface SendMessagePayload {
  receiverId: string
  text?: string
  image?: string
}
