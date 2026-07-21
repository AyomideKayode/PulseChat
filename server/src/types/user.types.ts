// server/src/types/user.types.ts

import { Document, Types } from 'mongoose'

export interface IUser {
  _id: Types.ObjectId
  fullName: string
  email: string
  password: string
  profilePicture: {
    url: string
    publicId: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface IUserDocument extends IUser, Document {}

export interface IUserResponse {
  _id: Types.ObjectId
  fullName: string
  email: string
  profilePicture: { url: string; publicId: string }
}

export function toUserResponse(user: IUserDocument): IUserResponse {
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    profilePicture: user.profilePicture,
  }
}
