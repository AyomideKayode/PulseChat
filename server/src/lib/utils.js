import jwt from 'jsonwebtoken';
import { ENV } from './env.js';

export const generateToken = (userId, res) => {
  const { JWT_SECRET } = ENV;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables.');
  }
  // Create the token
  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: '7d', // Token valid for 7 days
  });

  // Set the cookie
  res.cookie('jwt', token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // Prevent XSS attacks
    sameSite: 'strict', // Prevent CSRF attacks
    secure: ENV.NODE_ENV !== 'development', // Only use HTTPS in production
  });

  return token;
};
