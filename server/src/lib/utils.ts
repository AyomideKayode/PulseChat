// server/src/lib/utils.ts

import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { Types } from 'mongoose';
import { ENV } from './env.js';

export function generateToken(userId: Types.ObjectId, res: Response): void {
  const token = jwt.sign({ userId: userId.toString() }, ENV.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: ENV.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}
