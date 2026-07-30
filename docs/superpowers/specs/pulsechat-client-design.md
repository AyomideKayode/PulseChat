# PulseChat Frontend Design

> Design doc for Phase 3 — Client TypeScript Chat UI.
> Dark-default with light companion theme. Warm minimal aesthetic.

---

## Design Philosophy

**Subject:** Real-time conversation. PulseChat is named after the heartbeat metaphor — messages pulse between people in real time. The design should feel alive, responsive, and human without being theatrical.

**Audience:** People who want a clean, fast messaging experience that doesn't feel like a generic utility. This is for someone who appreciates thoughtful craft in the tools they use daily.

**Single job:** Get a message from one person to another as naturally as possible.

**Aesthetic risk:** Pairing a warm serif display (Instrument Serif) with a dark chat UI. Serifs on dark backgrounds are unusual in messaging apps. It's a deliberate choice: the serif says "this is personal, not industrial" while the dark theme keeps it practical for daily use. The copper accent (`#C87941`) is warm without being aggressive, a middle ground between playful coral and serious brown.

**Signature:** The avatar system — initials rendered on a warm-toned circular background (4 palettes derived from the accent), paired with a subtle pulse animation on the online indicator. This anchors every conversation item and message bubble with a human identifier that carries the brand's warmth. No two users get the same color, but all colors live in the same warm family.

---

## 1. Color System

### Dark Theme (default)

| Token              | Hex       | Usage                              |
| ------------------ | --------- | ---------------------------------- |
| `--surface`        | `#1A1817` | Main background (warm charcoal)    |
| `--card`           | `#242120` | Cards, inputs, sidebar             |
| `--bubble-sent`    | `#C87941` | at 20% opacity — sent bubble fill  |
| `--accent`         | `#C87941` | Buttons, active states, highlights |
| `--accent-hover`   | `#B06830` | Accent hover state                 |
| `--text-primary`   | `#F0EDEA` | Primary text                       |
| `--text-secondary` | `#8B8580` | Secondary text, labels, timestamps |
| `--border`         | `#2D2926` | Subtle borders, dividers           |
| `--online`         | `#4CAF50` | Online presence indicator          |

### Light Theme

| Token              | Hex       | Usage                              |
| ------------------ | --------- | ---------------------------------- |
| `--surface`        | `#F8F6F3` | Main background (warm off-white)   |
| `--card`           | `#FFFFFF` | Cards, inputs, sidebar             |
| `--bubble-sent`    | `#C87941` | at 12% opacity — sent bubble fill  |
| `--accent`         | `#C87941` | Buttons, active states, highlights |
| `--accent-hover`   | `#B06830` | Accent hover state                 |
| `--text-primary`   | `#1A1817` | Primary text                       |
| `--text-secondary` | `#8B8580` | Secondary text, labels, timestamps |
| `--border`         | `#E8E4DF` | Subtle borders, dividers           |
| `--online`         | `#4CAF50` | Online presence indicator          |

### Implementation

CSS custom properties on `:root` and `[data-theme="light"]`. Toggle persisted to `localStorage`. System preference respected on first visit via `prefers-color-scheme`, but dark is the default fallback.

---

## 2. Typography

| Role    | Face                 | Weight    | Usage                            |
| ------- | -------------------- | --------- | -------------------------------- |
| Display | **Instrument Serif** | 400       | App name, headings, onboarding   |
| Body    | **Inter**            | 400 / 500 | Chat messages, labels, body text |
| Utility | **JetBrains Mono**   | 400       | Timestamps, secondary info       |

- Instrument Serif loaded via Google Fonts (1 weight: 400)
- Inter loaded via Google Fonts (weights: 400, 500, 600, 700)
- JetBrains Mono loaded via Google Fonts (1 weight: 400)
- Body line length capped at 65-75ch
- `text-wrap: balance` on headings
- Display heading max `clamp()` ceiling: 6rem
- Display heading `letter-spacing` floor: -0.02em to -0.03em. Never tighter than -0.04em (letters start touching beyond that).
- Color contrast must be verified during implementation: `--accent` (#C87941) on `--surface` (#1A1817) for buttons ≥3:1; `--text-secondary` (#8B8580) on `--surface` for small text ≥4.5:1

---

## 3. Layout & Component Architecture

### Screen layout

```bash
┌──────────────────────────────────────────────┐
│  [Logo] PulseChat          [Avatar] [Logout] │  ← TopBar (64px, accent border-bottom)
├───────────────────┬──────────────────────────┤
│                   │                          │
│  🔍 Search...     │  Conversation Header     │
│                   │  (name + online dot)      │
│  ┌─────────────┐  │                          │
│  │ Alice ●   2 │  │  ┌──────────────────┐   │
│  │ Hey!        │  │  │ Received bubble   │   │
│  └─────────────┘  │  └──────────────────┘   │
│                   │           ┌──────────┐   │
│  ┌─────────────┐  │           │Sent      │   │
│  │ Bob        │  │           │bubble    │   │
│  └─────────────┘  │  └──────────┘   │
│                   │     typing...          │
│  ┌─────────────┐  │  ┌──────────────────────┐│
│  │ Charlie ◌   │  │  │ Message input   📎  ││
│  └─────────────┘  │  └──────────────────────┘│
│                   │                          │
└───────────────────┴──────────────────────────┘
```

### Component tree

```bash
App
├── AuthPage
│   ├── LoginForm
│   └── SignupForm
└── ProtectedRoute
    └── ChatLayout
        ├── TopBar
        │   ├── Logo + AppName
        │   ├── ThemeToggle
        │   └── UserMenu (avatar, logout)
        ├── Sidebar
        │   ├── SearchInput
        │   ├── ConversationList
        │   │   └── ConversationItem[]
        │   │       ├── Avatar (initials + online dot)
        │   │       ├── Name + lastMessage preview
        │   │       ├── UnreadBadge
        │   │       └── Timestamp
        │   └── UserSearch (modal/overlay for new conversation)
        └── MainPanel (conditional on active conversation)
            ├── ConversationHeader (name, online dot, back button on mobile)
            ├── MessageWindow
            │   └── MessageBubble[]
│       ├── Received: left-aligned, card background, accent timestamp
│       └── Sent: right-aligned, accent-tinted background
            ├── TypingIndicator
            └── MessageInput
                ├── Textarea (auto-resize, Enter to send, Shift+Enter newline)
                ├── ImageUploadButton (file picker, preview)
                └── SendButton (accent color when content present)
```

### Responsive behavior

| Breakpoint | Sidebar                     | Main panel                                 |
| ---------- | --------------------------- | ------------------------------------------ |
| ≥768px     | 340px fixed, always visible | Takes remaining width                      |
| <768px     | Overlay slide-in from left  | Full width. Back button returns to sidebar |

---

## 4. Signatures & Visual Details

### Signature: Avatar system

Every user is represented by a circular avatar with their initials on a warm-toned background. Four background colors are derived from the accent palette:

| #   | Hex       | Tone        |
| --- | --------- | ----------- |
| 1   | `#C87941` | Copper      |
| 2   | `#C49B6C` | Warm sand   |
| 3   | `#B07D5E` | Terracotta  |
| 4   | `#A67C52` | Muted ochre |

Assignment is deterministic — derived from a hash of the user ID. The avatar appears in the sidebar, the conversation header, and on message bubbles (received only). The online/offline dot sits at the bottom-right corner of the avatar.

This replaces the earlier idea of a left-border accent strip on message bubbles, which the design stress test flagged as a templated pattern.

### Message bubbles

| Variant  | Alignment | Background                                 | Timestamp        | Avatar |
| -------- | --------- | ------------------------------------------ | ---------------- | ------ |
| Sent     | Right     | Accent at 20% opacity (dark) / 12% (light) | Secondary        | None   |
| Received | Left      | `--card`                                   | **Accent color** | Shown  |

The accent-colored timestamp on received messages provides the same visual cue as a stripe would — you can instantly tell who sent what — without the stripe. Rounded corners throughout, max-width 70% of the chat area.

### Empty state

When a user has no conversations, the main panel shows a warm-toned composition:

- A simple illustration (hand-drawn-style SVG of a chat bubble with a heart or a simple phone graphic — not sketchy, intentionally minimal)
- "No conversations yet. Search for someone to start chatting."
- A prominent search prompt below

### Online indicator

10px green dot (`#4CAF50`) with a subtle opacity pulse (1→0.6→1) every 3 seconds. Fades to gray (`#666`) when offline. Rendered as part of the avatar component. The pulse name is intentional — it echoes the "Pulse" in PulseChat.

### Loading state (brand moment)

On initial auth check, the screen shows the PulseChat wordmark centered in Instrument Serif with a slow opacity breathe animation (1.5s cycle). No spinner — the name itself is the loading indicator.

---

## 5. Animation & Motion

### Principles

- Exponential ease-out curves throughout. No bounce, no elastic.
- `prefers-reduced-motion: reduce` respected — all animations fall back to instant opacity transitions.
- Animations enhance an already-visible default — content is never gated on animation completion.

### Animations

| Moment                        | Animation                                                                   |
| ----------------------------- | --------------------------------------------------------------------------- |
| Message sent                  | Fade in + slide up 8px (200ms, ease-out)                                    |
| Message received              | Same as sent, but appears on the opposite side                              |
| Auth loading (PulseChat logo) | Slow opacity breathe animation (1.5s cycle) — the name itself is the loader |
| Typing indicator              | 3 dots bounce sequentially (1s cycle), stops 2s after last keystroke        |
| Conversation switch           | Messages crossfade (150ms)                                                  |
| Online dot                    | Pulse opacity 1→0.6→1 every 3s                                              |
| Send button                   | Opacity + scale transition when input gains/loses content                   |
| Sidebar mobile                | Slide from left (250ms), backdrop overlay fade                              |
| Page transitions              | Simple fade (150ms)                                                         |
| Connection lost banner        | Slide down from top (200ms), auto-dismisses on reconnect                    |

---

## 6. State Management

### AuthContext

```sh
State: { user: IUser | null, loading: boolean }
Actions: login(email, password), signup(fullName, email, password), logout(), updateProfile(data)
Mount: GET /api/auth/check → restore session or set user to null
```

### SocketContext

```sh
State: { socket: Socket | null, onlineUsers: Set<string>, connected: boolean }
Lifecycle: connect after auth confirmed → disconnect on logout
Events: new_message, user_online, user_offline, typing_start, typing_stop
```

### ActiveConversationState (local to ChatPage)

```sh
State: { activeConversationId: string | null, messages: IMessage[], beforeCursor: string | null, hasMore: boolean }
```

### Message send flow

1. `MessageInput` calls `socket.emit('send_message', payload, ack)`
2. Optimistically append message to local array with `sending` status
3. On ack success: mark as `sent`
4. On ack error: mark with `error` state + "Tap to retry"
5. Receiver gets via `socket.on('new_message')` → appended to active conversation or unread incremented

### Conversation list updates

1. `useConversations` fetches `GET /api/conversations` on mount
2. When `new_message` arrives for a non-active conversation: update preview text + bump to top of list
3. When `new_message` arrives for active conversation: already appended in MessageWindow

---

## 7. Routing

```sh
/login   → AuthPage (LoginForm, redirect to / if authed)
/signup  → AuthPage (SignupForm, redirect to / if authed)
/        → ChatLayout (ProtectedRoute — redirect to /login if not authed)
```

ProtectedRoute shows a skeleton spinner on initial auth check (before `GET /check` resolves).

---

## 8. Error & Edge Case States

| State                      | UX                                                         |
| -------------------------- | ---------------------------------------------------------- |
| Auth loading               | Skeleton with PulseChat logo + subtle pulse                |
| No conversations           | Empty state illustration + "Search for someone to message" |
| No messages in convo       | "Say hello! Start the conversation."                       |
| Image upload error         | Inline error: "Couldn't upload image. Try again."          |
| Connection lost            | Top banner: "Reconnecting..." (auto-dismiss)               |
| Send failed                | Red exclamation on bubble, tap to retry                    |
| Message pagination loading | Small spinner at top of MessageWindow                      |
| Invalid route              | Redirect to /                                              |

---

## 9. Technology Choices

| Concern          | Choice                     | Why                                     |
| ---------------- | -------------------------- | --------------------------------------- |
| CSS              | Plain CSS Modules          | No framework lock-in, co-located styles |
| State            | React Context + useReducer | Project constraint, keeps it simple     |
| Routing          | react-router-dom v7        | Standard for React SPAs                 |
| Socket.IO client | socket.io-client           | Server already uses it                  |
| HTTP client      | Fetch API                  | No need for axios, credentials: include |
| Form handling    | Controlled components      | Simple enough for auth forms            |
| Image upload     | FileReader + fetch         | Direct multipart to server              |
| Icons            | Lucide React               | Lightweight, consistent                 |

---

## 10. File Structure

```bash
client/src/
├── types/
│   ├── auth.types.ts
│   ├── message.types.ts
│   └── socket-events.types.ts
├── services/
│   ├── api.ts
│   └── socket.ts
├── contexts/
│   ├── AuthContext.tsx
│   └── SocketContext.tsx
├── hooks/
│   ├── useConversations.ts
│   ├── useMessages.ts
│   └── useTypingIndicator.ts
├── pages/
│   ├── AuthPage.tsx
│   └── ChatPage.tsx
├── components/
│   ├── ProtectedRoute.tsx
│   ├── ChatLayout.tsx
│   ├── TopBar.tsx
│   ├── Sidebar.tsx
│   ├── ConversationList.tsx
│   ├── ConversationItem.tsx
│   ├── UserSearch.tsx
│   ├── ConversationHeader.tsx
│   ├── MessageWindow.tsx
│   ├── MessageBubble.tsx
│   ├── TypingIndicator.tsx
│   └── MessageInput.tsx
├── App.tsx
├── main.tsx
├── index.css
└── vite.config.ts
```
