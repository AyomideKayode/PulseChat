# PulseChat — Agent Guide

Full-stack real-time chat: Express 5 + TypeScript + MongoDB (Mongoose) + Socket.IO backend, React 19 + TypeScript + Vite frontend.

## Quick Start

```bash
# Root scripts
npm run build     # Install server deps, install client deps, build client
npm start         # Start server (production)

# Server dev
npm run dev --prefix server    # tsc --watch + nodemon on dist/
npm run build --prefix server  # tsc compile

# Client dev
npm run dev --prefix client    # Vite dev server on :5173
```

## Architecture

- **Monorepo** — `server/` and `client/` in root, no workspace manager
- **Server:** Express 5, ESM (`"type": "module"`), NodeNext module resolution
- **Auth:** JWT stored in HTTP-only cookie (`jwt`), 7-day expiry, sameSite strict
- **Rate limiting:** Arcjet on `/api/auth` routes (global middleware)
- **Email:** Resend (welcome email on signup, non-blocking on failure)
- **Media:** Cloudinary (profile picture, message images)
- **Database:** MongoDB via Mongoose
- **Real-time:** Socket.IO — JWT auth middleware, presence tracking (`Map<userId, Set<socketId>>`), room-based routing (`user:{userId}`)

## Client Key Files

| Path                                        | Purpose                                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| `client/src/App.tsx`                        | Root: BrowserRouter, AuthProvider, Sonner Toaster, Routes                     |
| `client/src/pages/ChatPage.tsx`             | Main chat: ESC close, optimistic send, mark_read on conversation switch       |
| `client/src/pages/AuthPage.tsx`             | Login/signup form with password toggle, error mapping, success toasts         |
| `client/src/components/ChatLayout.tsx`      | Layout shell: Sidebar + MessageArea, mobile responsive                        |
| `client/src/components/Sidebar.tsx`         | Tab sidebar: Chats (ConversationList) / Contacts (ContactsList)               |
| `client/src/components/ConversationList.tsx` | Conversation items with unread count, skeleton loading                        |
| `client/src/components/ContactsList.tsx`    | All users list from API, click-to-chat creates conversation, online dot       |
| `client/src/components/ConversationHeader.tsx` | User name/status, back button, opens ProfileModal on click                  |
| `client/src/components/ProfileModal.tsx`    | Dialog: avatar, name, email, joined date, online status, ESC+overlay close    |
| `client/src/components/MessageWindow.tsx`   | Message list with infinite scroll, auto-scroll, skeleton, empty state         |
| `client/src/components/MessageBubble.tsx`   | Message card with pulse-border for optimistic, sender avatar                  |
| `client/src/components/MessageInput.tsx`    | Text input + image upload, keyboard submit                                    |
| `client/src/components/SoundToggle.tsx`     | Web Audio notification sound on/off toggle in TopBar                          |
| `client/src/components/TopBar.tsx`          | Top bar: brand, sound toggle, theme toggle, unread badge                      |
| `client/src/contexts/SocketContext.tsx`     | Socket.IO connection, presence tracking, new_message sound, typing/read relay |
| `client/src/contexts/AuthContext.tsx`       | Auth state: login/signup/logout/checkAuth, user profile update                |
| `client/src/hooks/useMessages.ts`           | Message fetching with pagination, addMessage with replaceId for optimistic     |
| `client/src/hooks/useSoundToggle.ts`        | Sound preference state (ref-based, no localStorage)                           |
| `client/src/hooks/useTypingIndicator.ts`    | Typing start/stop emit with 4s debounce                                       |
| `client/src/hooks/useConversations.ts`      | Live conversation list with socket update listener                            |
| `client/src/lib/sound.ts`                   | Web Audio heartbeat chime, AudioContext singleton with beforeunload cleanup   |
| `client/src/services/api.ts`                | Typed fetch wrapper with toast errors, AbortSignal support, upload            |
| `client/src/types/message.types.ts`         | IMessage (with isOptimistic), IConversation, MessageStatus, socket event types |

## Server Key Files

| Path                      | Purpose                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `server/src/server.ts`    | Entry: Express app, HTTP server, Socket.IO, static serve                                      |
| `server/src/types/`       | TypeScript interfaces: IUser, IMessage, IConversation, socket events                          |
| `server/src/lib/`         | env, db, utils (generateToken), cloudinary, arcjet, resend                                    |
| `server/src/models/`      | Mongoose schemas: User, Message (+status field), Conversation                                 |
| `server/src/middleware/`  | auth (JWT verify), arcjet (rate limit + bot detection)                                        |
| `server/src/controllers/` | auth (signup/login/logout/updateProfile/checkAuth), message (contacts/messages/conversations) |
| `server/src/routes/`      | auth, message, conversation routes                                                            |
| `server/src/socket/`      | Socket.IO auth middleware, presence tracking, event handlers (message, typing, read)          |

## TypeScript Caveats

- All `.ts` files use `.js` extension in relative imports (NodeNext resolution), e.g. `import { x } from './env.js'`
- Strict mode, no `any`, explicit return types on all functions
- Express `Request` augmented via `src/types/express.d.ts` — `req.user` typed as `IUserDocument`
- Arcjet runs in `DRY_RUN` mode in development (non-blocking). Set `NODE_ENV=production` to enforce rules.

## Socket.IO

- **Auth:** JWT read from `socket.handshake.headers.cookie` at connection time, attaches user to `socket.data.user`. No client-side token access needed.
- **Presence:** `Map<userId, Set<socketId>>` — user is online if ≥1 socket active. `user_online`/`user_offline` events broadcast on state transitions only.
- **Events:** `send_message` (rate-limited 30/10s, validates, persists, upserts Conversation, ack), `typing_start`/`typing_stop` (relayed to receiver), `mark_read` (resets unreadCount, updates message statuses).
- **Rooms:** Each user joins `user:{userId}` on connect, leaves on disconnect. All targeting uses rooms.

## Conventions

- **Prettier** for all files — configured in `.prettierrc` (semicolons: true, single quotes, trailing commas). Run `npx prettier --write .` before committing.
- ESLint in client (`eslint.config.js`)
- `Record<string, unknown>` for dynamic objects, never `any`
- **Client styling:** Tailwind v4 via `@tailwindcss/vite` plugin. Theme tokens defined in `client/src/index.css` under `@theme` (colors, fonts, animations). Dark/light switching via `[data-theme='light']` overriding `--color-*` vars. Use semantic classes (`bg-surface`, `text-text-primary`, `border-border`, `font-sans`, `font-serif`, `animate-message-in`). Never use inline `style={{...}}` unless dynamic computed values prevent it (e.g., avatar background color from hash).

## Workflow

- Agent stages changes but does **not** commit until you explicitly say so.
- When you give the commit signal, agent groups changes into logical commits following the convention below.
- Agent should push back with reasoning when it has a better-informed opinion, not blindly follow suggestions.
- On review runs, agent must report findings (strengths, issues, verdict) to the user FIRST before making any changes. Only implement fixes after user confirms which ones to address.
- Before implementing frontend work, always reference `docs/superpowers/specs/pulsechat-client-design.md` for the full design spec (colors, typography, layout, animations, component tree, state management).

## Commit Convention

Group changes into logical commits following conventional commits:

```bash
feat(scope): description        # new feature
fix(scope): description         # bug fix
chore(deps): description        # dependency changes
chore(cleanup): description     # file removal
docs: description               # documentation only
```

Scope matches the directory/concern (types, lib, models, controllers, middleware, routes, socket). Each commit should compile independently (`npm run build --prefix server` passes).

## PR Description Template

```markdown
## Description

<!-- Briefly describe what this PR does and why -->

## Related Issue

<!-- Link the issue this PR addresses, e.g.: Closes #42 if applicable. N/A if otherwise -->

Closes #<if applicable>

## Type of Change

- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 📝 Documentation update
- [ ] ♻️ Refactor (no functional change)
- [ ] 🧪 Tests
- [ ] 🔧 Chore / maintenance

## Changes Made

<!-- List the key changes in this PR -->

-
-

## How to Test

<!-- Steps for reviewers to test your changes -->

1.
2.

## Screenshots (if applicable)

<!-- Before / after, or relevant UI screenshots -->

## Checklist

- [ ] My code follows the project's style and conventions
- [ ] I have tested my changes locally
- [ ] I have added/updated relevant documentation or comments
- [ ] My PR title follows the `type(scope): short description` convention
- [ ] I have linked the relevant issue(s) (or `N/A` if none)
```

## Environment Variables

Required: `MONGO_URI`, `JWT_SECRET`, `RESEND_API_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `ARCJET_KEY`
Optional: `PORT` (default 5000), `CLIENT_URL` (default [http://localhost:5173](http://localhost:5173)), `NODE_ENV` (default development)

## Debugging History

### 2026-07-29 — `POST /api/conversations/:userId` returning 200 null

**Problem:** Creating a conversation via POST returned HTTP 200 with body `null`, and the conversation was NOT persisted to MongoDB. `Conversation.create()` and `new Conversation().save()` both appeared to succeed but no document was created.

**Root cause:** A stale UNIQUE index on the `participants` field (`participants_1`) in MongoDB Atlas. The schema defines `conversationSchema.index({ participants: 1 })` (non-unique), but MongoDB had `unique: true` on this index. This prevented any participant from being in more than one conversation. The `save()` threw E11000, which was caught but silently swallowed.

**Fix:**
1. Dropped the `participants_1` index and recreated it as non-unique via `db.collection('conversations').dropIndex('participants_1')` + `createIndex({ participants: 1 })`.
2. Added proper 11000 duplicate key handling in the controller (falls back to `findOne` for `pairKey` collisions — covers race conditions).
3. Replaced `Conversation.create()` with `new Conversation().save()` + explicit `populate()` on the document to avoid Mongoose 9 `create` return behavior.

**Lesson:** Always verify MongoDB indexes match schema expectations when debugging silent write failures. A unique index created by accident (or stale from a prior schema iteration) will reject writes with E11000, and a bare `catch` that doesn't re-check can make it invisible.

### 2026-07-30 — Pre-merge code review (15 issues found & fixed)

**Problem:** Code review of 7 polish feature commits revealed 4 blocking, 5 important, and 6 advisory issues spanning optimistic message duplication, broken shimmer animation, dead code, ESC key conflicts, accessibility gaps, and missing error handling.

**Fixes applied:**
1. **Optimistic dedup** — `useMessages.addMessage` now accepts `replaceId` parameter. When ack returns, temp message is replaced rather than appended beside the real message.
2. **Dead code** — Removed restore-conversation `useEffect` that could never fire (both `lastActiveRef` and `activeConversation` were cleared simultaneously).
3. **Shimmer animation** — Added `--animate-shimmer: shimmer 1.5s ease-in-out infinite` to `@theme` in `index.css`. Tailwind v4 requires theme declarations for custom animations.
4. **ESC conflict** — ChatPage ESC handler now checks `document.querySelector('[role="dialog"]')` before closing conversation, so ProfileModal ESC doesn't also dismiss the chat.
5. **ProfileModal a11y** — Added `role="dialog"`, `aria-modal="true"`, `aria-label` on overlay, scroll lock (`document.body.style.overflow = 'hidden'` on mount), and `useRef` for `onClose` to avoid rebinding keydown listener on every render.
6. **Server `createdAt`** — Added `createdAt` to `.select()` calls across contacts endpoint, conversation participant population, and message sender/receiver population. ProfileModal "Joined" date now renders correctly.
7. **Accessibility** — SoundToggle: `aria-label`. Skeleton loaders: `role="status"` + `aria-label`. MessageSkeleton: stable widths (module-level constant, no `Math.random()` on render).
8. **Error handling** — `api.upload` now shows `toast.error()` on failure. `api.get` accepts `AbortSignal` param. ContactsList uses `AbortController` for cleanup.
9. **Type safety** — `handleSend` guards `user` with early return instead of non-null assertion.
10. **Sound cleanup** — Added `closeAudioContext()` + `beforeunload` listener to close `AudioContext` singleton on page navigation.

**Lesson:** Always run a structured code review before merging features. The reviewer caught 15 issues — including runtime bugs (optimistic dedup, shimmer), a11y violations, and silent failures — that would have been shipped to production. Pair the review with build verification for maximum confidence.
