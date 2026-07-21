// server/src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import { ENV } from '../lib/env.js'

interface JwtPayload {
  userId: string
}

export const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies?.jwt

    if (!token) {
      res.status(401).json({ message: 'Unauthorized - No token provided' })
      return
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload

    const user = await User.findById(decoded.userId).select('-password')
    if (!user) {
      res.status(401).json({ message: 'Unauthorized - User not found' })
      return
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(401).json({ message: 'Unauthorized - Token error' })
  }
}
