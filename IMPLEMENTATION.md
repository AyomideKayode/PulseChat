# PulseChat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a production-grade real-time chat application (TypeScript, Socket.IO, Express, MongoDB) with full case study for portfolio.

**Architecture:** Express 5 + TypeScript backend with MongoDB (Mongoose), Socket.IO for real-time messaging, JWT/HTTP-only cookie auth, Arcjet rate limiting, Cloudinary media uploads. React + TypeScript + Vite frontend. Deployed on Railway.

**Tech Stack:** TypeScript, Express 5, MongoDB/Mongoose, Socket.IO, React 19, Vite, Cloudinary, Arcjet, Railway

## Global Constraints

- **TypeScript strict mode** — no `any`, explicit return types
- **Module system** — ESM (`"type": "module"` in package.json, `NodeNext` module resolution)
- **Auth** — JWT in HTTP-only cookies only (no localStorage tokens)
- **Socket.IO auth** — server-side cookie parse from handshake headers
- **ESLint** — match existing config style if present
- **No state management library** — React Context + custom hooks only

---

## File Structure

```bash
PulseChat/
├── server/
│   ├── src/
│   │   ├── types/
│   │   │   ├── user.types.ts           # IUser interface
│   │   │   ├── message.types.ts        # IMessage, SendMessagePayload, MessageStatus enum
│   │   │   ├── conversation.types.ts   # IConversation
│   │   │   ├── socket-events.types.ts  # ClientToServerEvents, ServerToClientEvents, InterServerEvents
│   │   │   └── express.d.ts            # Augment Express Request with user property
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── message.model.ts
│   │   │   └── conversation.model.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   └── message.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── arcjet.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.route.ts
│   │   │   ├── message.route.ts
│   │   │   └── conversation.route.ts
│   │   ├── socket/
│   │   │   ├── index.ts                # Socket.IO setup + event wiring
│   │   │   ├── auth.ts                 # Socket.IO auth middleware
│   │   │   ├── presence.ts             # Online user tracking
│   │   │   └── handlers/
│   │   │       ├── message.handler.ts  # send_message event handler
│   │   │       ├── typing.handler.ts   # typing_start/stop handlers
│   │   │       └── read.handler.ts     # mark_read event handler
│   │   └── lib/
│   │       ├── env.ts
│   │       ├── db.ts
│   │       ├── utils.ts                # generateToken, etc.
│   │       ├── cloudinary.ts
│   │       ├── arcjet.ts
│   │       └── resend.ts
│   ├── server.ts                       # Entry: HTTP server + Socket.IO attach
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── types/
│   │   │   ├── auth.types.ts           # User, LoginPayload, SignupPayload
│   │   │   ├── message.types.ts        # Message, Conversation, SendMessagePayload
│   │   │   └── socket-events.types.ts  # ClientToServerEvents, ServerToClientEvents
│   │   ├── services/
│   │   │   ├── api.ts                  # Fetch wrapper with credentials
│   │   │   └── socket.ts               # Socket.IO client factory
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── SocketContext.tsx
│   │   ├── hooks/
│   │   │   ├── useConversations.ts
│   │   │   ├── useMessages.ts
│   │   │   └── useTypingIndicator.ts
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   └── ChatPage.tsx
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── ChatLayout.tsx
│   │   │   ├── ConversationList.tsx
│   │   │   ├── MessageWindow.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── UserSearch.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── package.json                        # Root scripts
```

---

## Phase 1: Server TypeScript Migration

### Task 1.1: Install dependencies and configure TypeScript

**Files:**

- Create: `PulseChat/server/tsconfig.json`
- Modify: `PulseChat/server/package.json`

- [ ] **Step 1: Install TypeScript and type definitions**

```bash
cd /home/ayomide/sandbox/PulseChat/server
npm install --save-dev typescript @types/node @types/express @types/cookie-parser @types/bcryptjs @types/jsonwebtoken
```

- [ ] **Step 2: Create tsconfig.json**

Write to `PulseChat/server/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Update server/package.json scripts**

Edit `PulseChat/server/package.json` — change `"dev"` and `"start"` scripts:

```json
"scripts": {
  "build": "tsc",
  "dev": "tsc --watch & nodemon --watch dist dist/server.js",
  "start": "node dist/server.js"
}
```

Also set `"type": "module"` if not already present (check — it should be there from JS setup).

- [ ] **Step 4: Add root package.json build/start scripts**

Edit `PulseChat/package.json`:

```json
"scripts": {
  "build": "npm run build --prefix server && npm run build --prefix client",
  "start": "npm run start --prefix server",
  "dev:server": "npm run dev --prefix server",
  "dev:client": "npm run dev --prefix client"
}
```

- [ ] **Step 5: Verify TypeScript compiles empty project**

```bash
cd /home/ayomide/sandbox/PulseChat/server
touch src/_placeholder.ts
npx tsc --noEmit
```

Expected: No output (success). Then remove `_placeholder.ts`.

### Task 1.2: Write type definitions

**Files:**

- Create: `PulseChat/server/src/types/user.types.ts`
- Create: `PulseChat/server/src/types/message.types.ts`
- Create: `PulseChat/server/src/types/conversation.types.ts`
- Create: `PulseChat/server/src/types/socket-events.types.ts`
- Create: `PulseChat/server/src/types/express.d.ts`

- [ ] **Step 1: Create user.types.ts**

```typescript
import { Document, Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  password: string;
  profilePicture: {
    url: string;
    publicId: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}

export interface IUserResponse {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  profilePicture: { url: string; publicId: string };
}

export function toUserResponse(user: IUserDocument): IUserResponse {
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    profilePicture: user.profilePicture,
  };
}
```

- [ ] **Step 2: Create message.types.ts**

```typescript
import { Document, Types } from 'mongoose';

export enum MessageStatus {
  Sent = 'sent',
  Delivered = 'delivered',
  Read = 'read',
}

export interface IMessage {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  text?: string;
  image?: string;
  status: MessageStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageDocument extends IMessage, Document {}

export interface SendMessagePayload {
  receiverId: string;
  text?: string;
  image?: string;
}
```

- [ ] **Step 3: Create conversation.types.ts**

```typescript
import { Document, Types } from 'mongoose';

export interface IConversation {
  participants: [Types.ObjectId, Types.ObjectId];
  lastMessage?: {
    text: string;
    senderId: Types.ObjectId;
    createdAt: Date;
  };
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversationDocument extends IConversation, Document {}
```

- [ ] **Step 4: Create socket-events.types.ts**

```typescript
import { IMessage } from './message.types.js';

export interface ServerToClientEvents {
  new_message: (message: IMessage) => void;
  user_online: (data: { userId: string }) => void;
  user_offline: (data: { userId: string }) => void;
  typing_start: (data: { userId: string }) => void;
  typing_stop: (data: { userId: string }) => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  send_message: (
    data: { receiverId: string; text?: string; image?: string },
    ack: (response: {
      success: boolean;
      message?: IMessage;
      error?: string;
    }) => void,
  ) => void;
  mark_read: (
    data: { conversationId: string },
    ack: (response: { success: boolean }) => void,
  ) => void;
  typing_start: (data: { receiverId: string }) => void;
  typing_stop: (data: { receiverId: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}
```

- [ ] **Step 5: Create express.d.ts**

```typescript
import { IUserDocument } from './user.types.js';

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}
```

### Task 1.3: Migrate lib/\* to TypeScript

**Files:**

- Create: `PulseChat/server/src/lib/env.ts` (from `env.js`)
- Create: `PulseChat/server/src/lib/db.ts` (from `db.js`)
- Create: `PulseChat/server/src/lib/utils.ts` (from `utils.js`)
- Create: `PulseChat/server/src/lib/cloudinary.ts` (from `cloudinary.js`)
- Create: `PulseChat/server/src/lib/arcjet.ts` (from `arcjet.js`)
- Create: `PulseChat/server/src/lib/resend.ts` (from `resend.js`)

- [ ] **Step 1: Migrate env.ts**

Read the existing `src/lib/env.js`, then rewrite as typed:

```typescript
import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: requireEnv('MONGODB_URI'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  ARCJET_KEY: process.env.ARCJET_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
} as const;
```

- [ ] **Step 2: Migrate db.ts**

Read existing `src/lib/db.js`, convert to TS:

```typescript
import mongoose from 'mongoose';
import { ENV } from './env.js';

export async function connectDB(): Promise<void> {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}
```

- [ ] **Step 3: Migrate utils.ts**

Read existing `src/lib/utils.js`. It should have `generateToken`:

```typescript
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
    secure: ENV.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}
```

- [ ] **Step 4: Migrate cloudinary.ts, arcjet.ts, resend.ts**

Read each file from `src/lib/` and rewrite as TypeScript. Add explicit return types. The libraries may or may not have types — if they don't, add `// @ts-expect-error` with a brief comment, or write minimal ambient declarations.

- [ ] **Step 5: Verify lib files compile**

```bash
cd /home/ayomide/sandbox/PulseChat/server
npx tsc --noEmit
```

Expected: No errors.

### Task 1.4: Migrate models to TypeScript

**Files:**

- Create: `PulseChat/server/src/models/user.model.ts` (from `user.model.js`)
- Create: `PulseChat/server/src/models/message.model.ts` (from `message.model.js`, extend with status)
- Create: `PulseChat/server/src/models/conversation.model.ts` (new)

- [ ] **Step 1: Create user.model.ts**

Read existing `user.model.js`, convert to TS using typed schema:

```typescript
import mongoose, { Schema } from 'mongoose';
import { IUserDocument } from '../types/user.types.js';

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
);

const User = mongoose.model<IUserDocument>('User', userSchema);
export default User;
```

- [ ] **Step 2: Create message.model.ts**

Read existing `message.model.js`, add `status` field:

```typescript
import mongoose, { Schema } from 'mongoose';
import { IMessageDocument, MessageStatus } from '../types/message.types.js';

const messageSchema = new Schema<IMessageDocument>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    image: { type: String },
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.Sent,
    },
  },
  { timestamps: true },
);

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

const Message = mongoose.model<IMessageDocument>('Message', messageSchema);
export default Message;
```

- [ ] **Step 3: Create conversation.model.ts**

```typescript
import mongoose, { Schema } from 'mongoose';
import { IConversationDocument } from '../types/conversation.types.js';

const conversationSchema = new Schema<IConversationDocument>(
  {
    participants: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: true,
      validate: {
        validator: (arr: unknown[]) => arr.length === 2,
        message: 'A conversation must have exactly 2 participants',
      },
    },
    lastMessage: {
      text: { type: String },
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date },
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true },
);

conversationSchema.index(
  { participants: 1 },
  {
    unique: true,
    // Ensure [A,B] and [B,A] are treated as the same conversation
    // This is enforced at query time, not index time
  },
);

const Conversation = mongoose.model<IConversationDocument>(
  'Conversation',
  conversationSchema,
);
export default Conversation;
```

- [ ] **Step 4: Verify models compile**

```bash
cd /home/ayomide/sandbox/PulseChat/server
npx tsc --noEmit
```

Expected: No errors.

### Task 1.5: Migrate middleware to TypeScript

**Files:**

- Create: `PulseChat/server/src/middleware/auth.middleware.ts` (from `auth.middleware.js`)
- Create: `PulseChat/server/src/middleware/arcjet.middleware.ts` (from `arcjet.middleware.js`)

- [ ] **Step 1: Create auth.middleware.ts**

Read existing `auth.middleware.js`. Convert to TS:

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { ENV } from '../lib/env.js';

interface JwtPayload {
  userId: string;
}

export const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies?.jwt;

    if (!token) {
      res.status(401).json({ message: 'Unauthorized - No token provided' });
      return;
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      res.status(401).json({ message: 'Unauthorized - User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Unauthorized - Token error' });
  }
};
```

- [ ] **Step 2: Create arcjet.middleware.ts**

Read existing `arcjet.middleware.js`. Convert to TS:

```typescript
import { Request, Response, NextFunction } from 'express';
import aj from '../lib/arcjet.js';
import { isSpoofedBot } from '@arcjet/inspect';

export const arcjetProtection = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        res
          .status(429)
          .json({ message: 'Rate Limit exceeded. Please try again later.' });
        return;
      }
      if (decision.reason.isBot()) {
        res.status(403).json({ message: 'Bot detected. Access denied.' });
        return;
      }
      res.status(403).json({ message: 'Access denied by security rules.' });
      return;
    }

    if (decision.results?.some(isSpoofedBot)) {
      res.status(403).json({
        error: 'Spoofed bot detected. Access denied.',
        message: 'Malicious bot activity detected.',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Arcjet protection error:', error);
    next();
  }
};
```

- [ ] **Step 3: Verify middleware compiles**

```bash
cd /home/ayomide/sandbox/PulseChat/server
npx tsc --noEmit
```

Expected: No errors.

### Task 1.6: Migrate controllers to TypeScript

**Files:**

- Create: `PulseChat/server/src/controllers/auth.controller.ts` (from `auth.controller.js`)
- Create: `PulseChat/server/src/controllers/message.controller.ts` (from `message.controller.js`, add new endpoints)

- [ ] **Step 1: Create auth.controller.ts**

Read existing `auth.controller.js`. Convert to TS. Update `generateToken` import, add types to request/response.

Key changes from JS version:

- Add explicit `Request`, `Response` types
- Typed request body access
- Use `toUserResponse()` for responses

```typescript
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '../emails/emailHandlers.js';
import { generateToken } from '../lib/utils.js';
import { ENV } from '../lib/env.js';
import cloudinary from '../lib/cloudinary.js';
import User from '../models/user.model.js';
import { toUserResponse } from '../types/user.types.js';

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { fullName, email, password } = req.body as {
    fullName?: string;
    email?: string;
    password?: string;
  };

  try {
    if (!fullName || !email || !password) {
      res.status(400).json({ message: 'All fields are required.' });
      return;
    }

    if (password.length < 8) {
      res
        .status(400)
        .json({ message: 'Password must be at least 8 characters long.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: 'Invalid email format.' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res
        .status(400)
        .json({ message: 'Unable to create account with provided details.' });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ fullName, email, password: hashedPassword });
    const savedUser = await newUser.save();
    generateToken(savedUser._id, res);

    try {
      await sendWelcomeEmail(
        savedUser.email,
        savedUser.fullName,
        ENV.CLIENT_URL,
      );
    } catch (error) {
      console.error('Failed to send welcome email (non-blocking):', error);
    }

    res.status(201).json(toUserResponse(savedUser));
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  try {
    if (!email || !password) {
      res.status(400).json({ message: 'All fields are required.' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials provided.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials provided.' });
      return;
    }

    generateToken(user._id, res);
    res.status(200).json(toUserResponse(user));
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.cookie('jwt', '', { maxAge: 0 });
  res.status(200).json({ message: 'Logged out successfully.' });
};

export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { fullName, profilePicture } = req.body as {
      fullName?: string;
      profilePicture?: string;
    };
    const userId = req.user!._id;

    if (!fullName && !profilePicture) {
      res.status(400).json({ message: 'At least one field is required' });
      return;
    }

    const updatedData: Record<string, unknown> = {};
    if (fullName) updatedData.fullName = fullName;

    if (profilePicture) {
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        res.status(404).json({ message: 'User not found.' });
        return;
      }

      if (currentUser.profilePicture?.publicId) {
        try {
          await cloudinary.uploader.destroy(
            currentUser.profilePicture.publicId,
          );
        } catch (destroyError) {
          console.error('Failed to delete old profile picture:', destroyError);
        }
      }

      const uploadResponse = await cloudinary.uploader.upload(profilePicture);
      updatedData.profilePicture = {
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedData },
      { new: true },
    ).select('-password');
    if (!updatedUser) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.status(200).json(toUserResponse(updatedUser));
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const checkAuth = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json(toUserResponse(req.user!));
};
```

- [ ] **Step 2: Create message.controller.ts**

Read existing `message.controller.js`. Convert to TS and expand with new endpoints:

```typescript
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Message from '../models/message.model.js';
import User from '../models/user.model.js';
import Conversation from '../models/conversation.model.js';

export const getAllContacts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const loggedInUserId = req.user!._id;
    const filteredUsers = await User.find(
      { _id: { $ne: loggedInUserId } },
      'fullName email profilePicture',
    ).select('-password');

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMessages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const { before } = req.query as { before?: string };
    const limit = 50;

    const filter: Record<string, unknown> = {
      $or: [
        { senderId: loggedInUserId, receiverId: userId },
        { senderId: userId, receiverId: loggedInUserId },
      ],
    };

    if (before && mongoose.Types.ObjectId.isValid(before)) {
      filter._id = { $lt: new mongoose.Types.ObjectId(before) };
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('senderId', 'fullName email profilePicture')
      .populate('receiverId', 'fullName email profilePicture');

    res.status(200).json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getConversations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .sort({ 'lastMessage.createdAt': -1 })
      .populate('participants', 'fullName email profilePicture');

    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

- [ ] **Step 3: Verify controllers compile**

```bash
cd /home/ayomide/sandbox/PulseChat/server
npx tsc --noEmit
```

Expected: No errors.

### Task 1.7: Migrate routes and server entry point

**Files:**

- Create: `PulseChat/server/src/routes/auth.route.ts` (from `auth.route.js`, add `/check`)
- Create: `PulseChat/server/src/routes/message.route.ts` (from `message.route.js`, add new endpoints)
- Create: `PulseChat/server/src/routes/conversation.route.ts` (new)
- Create: `PulseChat/server/src/server.ts` (from `server.js`, add Socket.IO setup skeleton)

- [ ] **Step 1: Create auth.route.ts**

```typescript
import { Router } from 'express';
import {
  signup,
  login,
  logout,
  updateProfile,
  checkAuth,
} from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import { arcjetProtection } from '../middleware/arcjet.middleware.js';

const router = Router();

router.use(arcjetProtection);

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.put('/update-profile', protectRoute, updateProfile);
router.get('/check', protectRoute, checkAuth);

export default router;
```

- [ ] **Step 2: Create message.route.ts**

```typescript
import { Router } from 'express';
import { getAllContacts } from '../controllers/message.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/contacts', protectRoute, getAllContacts);

export default router;
```

- [ ] **Step 3: Create conversation.route.ts**

```typescript
import { Router } from 'express';
import { getConversations } from '../controllers/message.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', protectRoute, getConversations);

export default router;
```

- [ ] **Step 4: Create server.ts**

```typescript
import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import conversationRoutes from './routes/conversation.route.js';
import { connectDB } from './lib/db.js';
import { ENV } from './lib/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const PORT = ENV.PORT || 5000;

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);

// Socket.IO (wired in Phase 2)
const io = new Server(httpServer, {
  cors: {
    origin: ENV.CLIENT_URL,
    credentials: true,
  },
});

// TODO: Phase 2 — wire Socket.IO auth middleware and event handlers

// Serve static frontend in production
if (ENV.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.send('PulseChat API is running in development mode.');
  });
}

try {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`PulseChat running on port ${PORT}`);
  });
} catch (error) {
  console.error('Failed to start PulseChat:', error);
  process.exit(1);
}
```

- [ ] **Step 5: Remove old .js files**

```bash
cd /home/ayomide/sandbox/PulseChat/server

# Remove migrated JS files (only after verifying TS compiles)
rm src/lib/env.js src/lib/db.js src/lib/utils.js src/lib/cloudinary.js src/lib/arcjet.js src/lib/resend.js
rm src/models/user.model.js src/models/message.model.js
rm src/middleware/auth.middleware.js src/middleware/arcjet.middleware.js
rm src/controllers/auth.controller.js src/controllers/message.controller.js
rm src/routes/auth.route.js src/routes/message.route.js
rm src/server.js
```

- [ ] **Step 6: Full compile check**

```bash
cd /home/ayomide/sandbox/PulseChat/server
npx tsc --noEmit
```

Expected: Zero errors.

---

## Phase 2: Server Socket.IO + Message CRUD

### Task 2.1: Build Socket.IO infrastructure

- [ ] Install `socket.io` if not already (`npm install socket.io`)
- [ ] Create `src/socket/auth.ts` — parse JWT from `socket.handshake.headers.cookie`, attach user to `socket.data.user`
- [ ] Create `src/socket/presence.ts` — `Map<userId, Set<socketId>>`, join room `user:<userId>`, broadcast online/offline
- [ ] Create `src/socket/handlers/message.handler.ts` — `send_message`: validate, persist, upsert Conversation, emit `new_message`
- [ ] Create `src/socket/handlers/typing.handler.ts` — `typing_start` / `typing_stop`: relay to receiver room
- [ ] Create `src/socket/handlers/read.handler.ts` — `mark_read`: reset unread counts, update message statuses
- [ ] Create `src/socket/index.ts` — init Socket.IO with CORS, wire middleware + handlers
- [ ] Wire `io` into `server.ts` (replace `// TODO`)
- [ ] Add in-memory rate limiter for `send_message` (30/10s per user)

### Task 2.2: Build remaining REST endpoints

- [ ] Add `GET /api/messages/:userId` to message route (cursor pagination)
- [ ] Add `POST /api/messages/upload` (multer + Cloudinary)
- [ ] Wire `GET /api/conversations`

### Task 2.3: Manual smoke test

- [ ] Start server, verify two browser clients can connect, send messages, see typing indicators, see online status

---

## Phase 3: Client TypeScript Chat UI

### Task 3.1: Project setup

- [ ] Install TypeScript: `typescript`, `@types/react`, `@types/react-dom`
- [ ] Create `tsconfig.json` (strict, `jsx: "react-jsx"`)
- [ ] Create `vite.config.ts` (move from `vite.config.js`)
- [ ] Rename `.jsx` to `.tsx` in existing files, add types
- [ ] Install `react-router-dom`, `socket.io-client`

### Task 3.2: Services layer

- [ ] `src/services/api.ts` — typed fetch wrapper with `credentials: 'include'`
- [ ] `src/services/socket.ts` — typed Socket.IO client

### Task 3.3: Auth flow

- [ ] `AuthContext` — session restore, login/signup/logout, loading state
- [ ] `LoginPage` — form, validation, error states
- [ ] `SignupPage` — form, validation, error states
- [ ] `ProtectedRoute` — redirect to /login if unauthenticated

### Task 3.4: Socket context + presence

- [ ] `SocketContext` — connect after auth, disconnect on logout, track `onlineUsers`

### Task 3.5: Chat UI components

- [ ] `ChatPage` — main layout with routing
- [ ] `ChatLayout` — sidebar + main panel, responsive
- [ ] `ConversationList` — search, scroll, unread badges, selected state
- [ ] `UserSearch` — search users, start conversation
- [ ] `MessageWindow` — message bubbles, auto-scroll, typing indicator, pagination
- [ ] `MessageInput` — textarea, send, image upload with preview

### Task 3.6: Custom hooks

- [ ] `useConversations` — fetch, subscribe to `new_message` for live preview updates
- [ ] `useMessages` — fetch history, append real-time messages, paginate
- [ ] `useTypingIndicator` — debounced emit, consume partner state

### Task 3.7: Polish

- [ ] Loading/empty/error states for every component
- [ ] Responsive layout (mobile sidebar toggle)

---

## Phase 4: Deploy

### Task 4.1: MongoDB Atlas

- [ ] Create free-tier cluster
- [ ] Allow all IPs (or Railway IP range)
- [ ] Copy connection string

### Task 4.2: Railway deployment

- [ ] Create Railway project from PulseChat root
- [ ] Set build command: `npm run build`
- [ ] Set start command: `npm start`
- [ ] Set environment variables in Railway dashboard
- [ ] Trigger deploy

### Task 4.3: Smoke test

- [ ] Signup, login, send message, receive message, upload image, logout

---

## Phase 5: Case Study + Portfolio

### Task 5.1: Write case study

- [ ] Cover JWT/HTTP-only cookie auth
- [ ] Cover Socket.IO real-time architecture
- [ ] Cover Arcjet rate limiting
- [ ] Save as MDX to portfolio case-studies dir

### Task 5.2: Update portfolio

- [ ] Set `featured: true`, add `slug: 'pulsechat'` and `live` URL in `projects.config.ts`
- [ ] Add case study import to `case-studies.ts`
