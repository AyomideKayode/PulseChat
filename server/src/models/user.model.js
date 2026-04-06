// server/src/models/user.model.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
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
);

const User = mongoose.model('User', userSchema);

export default User;
