// server/src/types/express.d.ts

import { IUserDocument } from './user.types.js'

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument
    }
  }
}
