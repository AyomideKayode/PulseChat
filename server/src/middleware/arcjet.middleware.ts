// server/src/middleware/arcjet.middleware.ts

import { Request, Response, NextFunction } from 'express'
import aj from '../lib/arcjet.js'
import { isSpoofedBot } from '@arcjet/inspect'

export const arcjetProtection = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const decision = await aj.protect(req)

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        res.status(429).json({ message: 'Rate Limit exceeded. Please try again later.' })
        return
      }
      if (decision.reason.isBot()) {
        res.status(403).json({ message: 'Bot detected. Access denied.' })
        return
      }
      res.status(403).json({ message: 'Access denied by security rules.' })
      return
    }

    if (decision.results?.some(isSpoofedBot)) {
      res.status(403).json({
        error: 'Spoofed bot detected. Access denied.',
        message: 'Malicious bot activity detected.',
      })
      return
    }

    next()
  } catch (error) {
    console.error('Arcjet protection error:', error)
    next()
  }
}
