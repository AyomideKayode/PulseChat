import aj from '../lib/arcjet.js';
import { isSpoofedBot } from '@arcjet/inspect';

export const arcjetProtection = async (req, res, next) => {
  try {
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res
          .status(429)
          .json({ message: 'Rate Limit exceeded. Please try again later.' });
      } else if (decision.reason.isBot()) {
        return res
          .status(403)
          .json({ message: 'Bot detected. Access denied.' });
      } else {
        return res
          .status(403)
          .json({ message: 'Access denied by security rules.' });
      }
    }

    // check if spoofed bot that bypassed detection
    if (decision.results.some(isSpoofedBot)) {
      return res.status(403).json({
        error: 'Spoofed bot detected. Access denied.',
        message: 'Malicious bot activity detected.',
      });
    }
    next();
  } catch (error) {
    console.log('Arcjet protection error:', error);
    // Fail open on error to avoid blocking legitimate traffic
    next();
  }
};
