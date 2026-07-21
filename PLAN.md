# PulseChat — Build Plan

Full-stack real-time chat application. Express + TypeScript + MongoDB + Socket.IO backend, React + TypeScript + Vite frontend. JWT/HTTP-only cookie auth, Arcjet rate limiting, Cloudinary asset management, deployed on Railway.

## Directories

```bash
PulseChat/
├── server/
│   ├── src/
│   │   ├── types/              # IMessage, IUser, IConversation, Socket event payloads
│   │   ├── models/             # Mongoose schemas → TS interfaces
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # auth.middleware.ts, arcjet.middleware.ts
│   │   ├── routes/             # auth.route.ts, message.route.ts, conversation.route.ts
│   │   ├── socket/             # Socket.IO setup, auth middleware, event handlers, presence
│   │   ├── lib/                # db.ts, env.ts, cloudinary.ts, arcjet.ts, resend.ts, utils.ts
│   │   └── server.ts           # Entry point
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── components/         # ChatLayout, ConversationList, MessageWindow, etc.
│   │   ├── contexts/           # AuthContext, SocketContext
│   │   ├── hooks/              # useConversations, useMessages, useTypingIndicator
│   │   ├── pages/              # LoginPage, SignupPage, ChatPage
│   │   ├── services/           # api.ts, socket.ts
│   │   ├── types/              # Client-side type definitions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── tsconfig.json
└── package.json                # Root scripts: "build", "start"
```

## Data Model

### User (existing, re-type)

```typescript
fullName: string
email: string (unique)
password: string (hashed, min 8)
profilePicture: { url: string, publicId: string }
timestamps
```

### Message (extended)

```typescript
senderId: ObjectId (ref User, required)
receiverId: ObjectId (ref User, required)
text?: string (trim, max 2000)
image?: string (URL)
status: 'sent' | 'delivered' | 'read'
timestamps
```

Index: `{ senderId: 1, receiverId: 1, createdAt: -1 }`

### Conversation (new)

```typescript
participants: [ObjectId, ObjectId] — exactly 2, compound unique index
lastMessage?: { text: string, senderId: ObjectId, createdAt: Date }
unreadCount: Map<string, number> — userId → count
timestamps
```

Index: `{ participants: 1 }` (compound, unique). Query: find by both participant IDs regardless of order.

Conversation is created atomically on first `send_message` if none exists between the pair.

## Socket.IO Architecture

### Server setup

- HTTP server wraps Express app
- Socket.IO attaches to HTTP server with CORS config
- Auth middleware runs on every connection: read JWT from `socket.handshake.headers.cookie`, verify, attach user to `socket.data.user`
- On connect: add socket to `userId → Set<socketId>` map, join room `user:<userId>`, broadcast `user_online` if user was previously offline
- On disconnect: remove from map, broadcast `user_offline` only when user has zero remaining sockets

### Events

| Event          | Direction       | Payload                         | Server Action                                                                                                                                          |
| -------------- | --------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `send_message` | Client→Server   | `{ receiverId, text?, image? }` | Validate (rate limit 30/10s, text length, receiver exists), persist to DB, upsert Conversation with lastMessage, emit `new_message` to receiver's room |
| `new_message`  | Server→Receiver | full IMessage                   | Append to conversation UI                                                                                                                              |
| `mark_read`    | Client→Server   | `{ conversationId }`            | Reset unreadCount for sender to 0, update message statuses, ack                                                                                        |
| `typing_start` | Client→Server   | `{ receiverId }`                | Relay to receiver's room                                                                                                                               |
| `typing_stop`  | Client→Server   | `{ receiverId }`                | Relay to receiver's room                                                                                                                               |
| `user_online`  | Server→All      | `{ userId }`                    | Update presence indicator                                                                                                                              |
| `user_offline` | Server→All      | `{ userId }`                    | Update presence indicator                                                                                                                              |

Presence: in-memory `Map<userId, Set<socketId>>`. Single-process only; would need Redis adapter for horizontal scaling.

## API Routes

### Auth — `/api/auth`

| Method | Route             | Auth   | Purpose                                  |
| ------ | ----------------- | ------ | ---------------------------------------- |
| POST   | `/signup`         | Arcjet | Create account, set JWT HTTP-only cookie |
| POST   | `/login`          | Arcjet | Authenticate, set JWT HTTP-only cookie   |
| POST   | `/logout`         | —      | Clear JWT cookie                         |
| PUT    | `/update-profile` | JWT    | Update name / profile picture            |
| GET    | `/check`          | JWT    | Validate session, return current user    |

### Messages — `/api/messages`

| Method | Route       | Auth | Purpose                                                                                          |
| ------ | ----------- | ---- | ------------------------------------------------------------------------------------------------ |
| GET    | `/contacts` | JWT  | List all users except self (start new chat)                                                      |
| GET    | `/:userId`  | JWT  | Message history with user, cursor-based pagination (limit=50, query param `before` = last `_id`) |
| POST   | `/upload`   | JWT  | Upload image to Cloudinary, return URL                                                           |

### Conversations — `/api/conversations`

| Method | Route | Auth | Purpose                                                                   |
| ------ | ----- | ---- | ------------------------------------------------------------------------- |
| GET    | `/`   | JWT  | List conversations for current user, sorted by lastMessage.createdAt desc |

## Client Architecture

### State management — React Context + hooks

**AuthContext:** `user`, `login()`, `signup()`, `logout()`, `loading`. On mount, calls `GET /api/auth/check` to restore session.

**SocketContext:** `socket` (SocketIO.Client instance), `onlineUsers` (`Set<string>`), `connected` (boolean). Initializes socket after AuthContext confirms user is authenticated. Disconnects on logout.

**Hooks:**

- `useConversations()` — fetch list, subscribe to new_message to update previews
- `useMessages(userId)` — fetch history for active conversation, append real-time messages, handle pagination scroll
- `useTypingIndicator(receiverId)` — debounced emit of typing_start/typing_stop, consume partner typing state

### Routing

- `/login` → LoginPage (redirects to / if authenticated)
- `/signup` → SignupPage (redirects to / if authenticated)
- `/` → ChatPage (ProtectedRoute — redirects to /login if not authenticated)

### ChatPage layout

Sidebar: ConversationList (search, scroll, unread badges) | Main: MessageWindow + MessageInput

### Key UX states

Every component handles: loading, empty (no conversations, no messages), error, success. ProtectedRoute shows spinner while auth is checking.

## Execution Phases

### Phase 1 — Server: TypeScript Migration (Day 1)

1. Install TS deps: `typescript`, `@types/node`, `@types/express`, `@types/cookie-parser`, `@types/bcryptjs`, `@types/jsonwebtoken`
2. Create `tsconfig.json` — strict, NodeNext module, ES2022 target, outDir: dist, rootDir: src
3. Write type definitions (`src/types/`):
   - `IUser` interface matching user model
   - `IMessage` interface matching message model (extend with status field)
   - `IConversation` interface for new conversation model
   - Socket event payload types
4. Migrate `src/lib/*` — env.ts, db.ts, utils.ts, cloudinary.ts, arcjet.ts, resend.ts
5. Migrate `src/models/*` — user.model.ts (existing), message.model.ts (add status), conversation.model.ts (new)
6. Migrate `src/middleware/*` — auth.middleware.ts, arcjet.middleware.ts
7. Migrate `src/controllers/*` — auth.controller.ts, message.controller.ts
8. Migrate `src/routes/*` — auth.route.ts, message.route.ts
9. Migrate `src/server.ts`
10. Verify: `npm run build` and `npm run dev` work

### Phase 2 — Server: Socket.IO + Message CRUD (Day 2-3)

1. Install socket.io + @types/socket.io
2. Build `src/socket/index.ts`:
   - Socket.IO server initialization (attach to HTTP server)
   - Auth middleware (parse JWT from handshake cookie)
   - Presence tracking (`Map<userId, Set<socketId>>`)
   - Event handlers: send_message, mark_read, typing_start, typing_stop
   - Conversation auto-creation on first message
3. Build message routes:
   - `GET /api/messages/:userId` — cursor-based pagination by `_id`
   - `POST /api/messages/upload` — multer + Cloudinary upload
4. Build conversation routes:
   - `GET /api/conversations` — list with last message preview + unread counts
5. Verify: manual test with Socket.IO client or curl for REST

### Phase 3 — Client: TypeScript Chat UI (Day 4-6)

1. Add TypeScript: `typescript`, `@types/react`, `@types/react-dom`, `tsconfig.json` (strict, JSX: react-jsx)
2. Rename .jsx → .tsx, add types to existing files
3. Install: `react-router-dom`, `socket.io-client`
4. Build services:
   - `api.ts` — fetch wrapper with `credentials: 'include'`, base URL from env
   - `socket.ts` — socket initialization with auth
5. Build contexts:
   - `AuthContext.tsx` — session restore, login/signup/logout, loading state
   - `SocketContext.tsx` — connection lifecycle, onlineUsers tracking
6. Build pages: LoginPage, SignupPage, ChatPage
7. Build components:
   - ProtectedRoute — redirect if not authenticated (spinner during loading)
   - ChatLayout — flex sidebar + main; responsive (sidebar collapses on mobile)
   - ConversationList — search input, scrollable list, unread badges, selected state
   - MessageWindow — scroll-to-bottom on mount/new message, auto-scroll toggle, typing indicator
   - MessageInput — textarea (enter to send, shift+enter newline), image upload button with preview
   - UserSearch — search users by name, select to start conversation
8. Wire Socket.IO events:
   - Send: emit send_message → optimistic add to UI → ack confirms or rolls back
   - Receive: listen new_message → append to active conversation or increment unread
   - Typing: listen typing_start/stop for partner
   - Presence: listen user_online/offline → update green dots
9. Build hooks:
   - `useConversations` — fetch list, subscribe to new_message for live updates
   - `useMessages` — fetch history, paginate on scroll up, append real-time
   - `useTypingIndicator` — debounced emit, listen partner state

### Phase 4 — Polish + Deploy (Day 7)

1. Loading/empty/error states for every component
2. Responsive layout adjustments (mobile-first sidebar behavior)
3. Railway deployment: `nixpacks.toml` or Dockerfile, build command: `npm run build`, start: `npm start`
4. MongoDB Atlas cluster creation + IP allowlist for Railway
5. Environment variables in Railway dashboard: `JWT_SECRET`, `MONGODB_URI`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `ARCJET_KEY`, `RESEND_API_KEY`, `CLIENT_URL`, `NODE_ENV=production`
6. Custom domain (optional)
7. Smoking test: signup → login → find user → send message → receive → upload image

### Phase 5 — Case Study + Portfolio (After deploy)

1. Write case study (MDX) covering:
   - JWT/HTTP-only cookie auth design (why HTTP-only > localStorage)
   - Socket.IO real-time architecture (rooms, presence, event flow)
   - Arcjet rate limiting integration (fail-open philosophy, bot detection)
2. Add to portfolio:
   - `src/lib/projects.config.ts` — set PulseChat featured: true, add slug, add live URL
   - `src/lib/case-studies.ts` — add case study import
   - `src/content/case-studies/pulsechat.mdx` — case study content
3. Write architecture doc in `PulseChat/docs/`

## Edge Cases & Constraints

- **WebSocket auth**: JWT is set as HTTP-only cookie. Socket.IO handshake includes the cookie header. Server middleware parses and verifies. No need for client to read the token.
- **Multi-tab presence**: User with 2+ tabs has 2+ socketIds in presence map. Only marked offline when ALL sockets disconnect.
- **Conversation deduplication**: Before creating Conversation, query both orderings of participants. Compound unique index prevents race duplicates.
- **Message order**: Sort by `createdAt` (or `_id` which embeds timestamp). Pagination uses cursor-based (`_id` before filter), not offset.
- **Optimistic sends**: Sender sees message immediately in UI. On ack failure, mark with error state and offer retry.
- **Rate limiting**: Arcjet on auth routes. In-memory rate limiter on `send_message` (30 events per 10s per user — configurable).
- **Image upload**: REST-only (multipart). Max 5MB. Compressed on client before upload. Cloudinary returns URL included in Socket.IO send_message.
- **Error format**: All REST errors: `{ message: string }`. All Socket.IO ack errors: `{ error: string }`. Socket.IO error events for server-pushed failures.
