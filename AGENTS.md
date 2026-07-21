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
- **Real-time:** Socket.IO (Phase 2 — not yet wired)

## Server Key Files

| Path                      | Purpose                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `server/src/server.ts`    | Entry: Express app, HTTP server, Socket.IO (skeleton), static serve                           |
| `server/src/types/`       | TypeScript interfaces: IUser, IMessage, IConversation, socket events                          |
| `server/src/lib/`         | env, db, utils (generateToken), cloudinary, arcjet, resend                                    |
| `server/src/models/`      | Mongoose schemas: User, Message (+status field), Conversation                                 |
| `server/src/middleware/`  | auth (JWT verify), arcjet (rate limit + bot detection)                                        |
| `server/src/controllers/` | auth (signup/login/logout/updateProfile/checkAuth), message (contacts/messages/conversations) |
| `server/src/routes/`      | auth, message, conversation routes                                                            |

## TypeScript Caveats

- All `.ts` files use `.js` extension in relative imports (NodeNext resolution), e.g. `import { x } from './env.js'`
- Strict mode, no `any`, explicit return types on all functions
- Express `Request` augmented via `src/types/express.d.ts` — `req.user` typed as `IUserDocument`
- Arcjet runs in `DRY_RUN` mode in development (non-blocking). Set `NODE_ENV=production` to enforce rules.

## Socket.IO Auth

JWT read from `socket.handshake.headers.cookie` at connection time. No client-side token access needed.

## Conventions

- **Prettier** for all files — configured in `.prettierrc` (semicolons: true, single quotes, trailing commas). Run `npx prettier --write .` before committing.
- ESLint in client (`eslint.config.js`)
- `Record<string, unknown>` for dynamic objects, never `any`

## Workflow

- Agent stages changes but does **not** commit until you explicitly say so.
- When you give the commit signal, agent groups changes into logical commits following the convention below.
- Agent should push back with reasoning when it has a better-informed opinion, not blindly follow suggestions.

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

## Environment Variables

Required: `MONGO_URI`, `JWT_SECRET`, `RESEND_API_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `ARCJET_KEY`
Optional: `PORT` (default 5000), `CLIENT_URL` (default [http://localhost:5173](http://localhost:5173)), `NODE_ENV` (default development)
