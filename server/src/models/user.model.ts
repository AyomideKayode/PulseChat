// server/src/models/user.model.ts

import mongoose, { Schema } from 'mongoose'
import { IUserDocument } from '../types/user.types.js'

const userSchema = new Schema<IUserDocument>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 8 },
    profilePicture: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
  },
  { timestamps: true },
)

const User = mongoose.model<IUserDocument>('User', userSchema)
export default User
