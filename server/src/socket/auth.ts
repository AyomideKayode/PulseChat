// server/src/socket/auth.ts

import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { ENV } from '../lib/env.js';
import { IUserDocument } from '../types/user.types.js';

interface JwtPayload {
  userId: string;
}

declare module 'socket.io' {
  interface Socket {
    user?: IUserDocument;
  }
}

export async function authenticateSocket(socket: Socket): Promise<void> {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      throw new Error('No cookie provided');
    }

    const jwtCookie = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('jwt='));

    if (!jwtCookie) {
      throw new Error('No JWT cookie found');
    }

    const token = jwtCookie.slice(4);

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }

    socket.data.user = user;
  } catch (error) {
    socket.disconnect();
  }
}
