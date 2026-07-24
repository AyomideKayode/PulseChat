# PulseChat Client — Fix Plan

## Problems Found

### P1: UserSearch click does nothing
`client/src/components/UserSearch.tsx:22-25` — `handleSelectUser` closes the modal and clears the query, never opens a conversation or calls `onSelectUser`. Also `Sidebar` passes `onSelectUser={() => {}}` — a dead no-op.

### P2: No REST endpoint to create/find a conversation
Conversations are only created server-side via the `send_message` socket event's `pairKey` upsert in `server/src/socket/handlers/message.handler.ts:83-123`. There is no `POST /api/conversations` endpoint.

### P3: `useConversations` never refreshes after new conversation
`client/src/hooks/useConversations.ts` fetches once on mount. No socket listener refreshes the list.

### P4: No Tailwind v4
All components use inline `style={{...}}` objects. Animation keyframes are raw CSS.

### P5: Responsive layout incomplete
Sidebar is just hidden on mobile. No slide-overlay, no backdrop.

### P6: `new_message` listener drops messages from non-active conversations
`ChatPage.tsx:33-39` only checks `senderId === otherUserId`. Messages from other users are silently dropped, conversation list never updates.

### P7: Sidebar doesn't pass `conversations` to UserSearch
UserSearch needs existing conversations to avoid unnecessary API calls.

### P8: Self-conversation vulnerability
New endpoint must guard against `userId === currentUser._id`.

### P9: Response shape mismatch
New endpoint must `.populate('participants', ...)` to match client `IConversation`.

---

## Fix Plan (12 steps)

### Step 1 — Server: Add conversation find-or-create endpoint

**File:** `server/src/controllers/message.controller.ts`
Add `getOrCreateConversation`:

```
POST /api/conversations/:userId
Auth: protectRoute
Logic:
  1. Validate ObjectId
  2. Guard: userId === currentUser._id → 400
  3. Build pairKey from sorted ObjectIds (same as socket handler)
  4. findOneAndUpdate with upsert:
     - Match on { pairKey }
     - $setOnInsert: { participants: [sorted], pairKey }
  5. Populate participants with 'fullName email profilePicture'
  6. Return 200 (found) or 201 (created)
  7. Duplicate key (11000) fallback
```

**File:** `server/src/routes/conversation.route.ts`
Add: `router.post('/:userId', protectRoute, getOrCreateConversation)`

### Step 2 — Client: Thread conversations + selection through Sidebar → UserSearch

**File:** `client/src/components/Sidebar.tsx`
- Pass `existingConversations` and real `onSelectUser` callback to UserSearch
- `onSelectUser` calls `onSelectConversation` then `refetch()`

**File:** `client/src/components/UserSearch.tsx`
- Accept `existingConversations: IConversation[]` prop
- `handleSelectUser`: check existing list first, POST API if not found, call `onSelectUser`

### Step 3 — Client: Socket-driven conversation list refresh

**File:** `client/src/hooks/useConversations.ts`
- Accept optional `socket`
- Listen for `new_message` → call `fetch()`
- Clean up on unmount

### Step 4 — Client: ChatPage increments refresh key

**File:** `client/src/pages/ChatPage.tsx`
- Already handles `new_message` for active conversation (unchanged)
- Add separate refresh mechanism that triggers conversation list update
- Pass `socket` to Sidebar → useConversations (already covered by Step 3)

### Step 5 — Install Tailwind v4

```bash
npm install tailwindcss @tailwindcss/vite
```

### Step 6 — Configure Tailwind v4

**File:** `client/vite.config.ts` — add `tailwindcss()` plugin.

**File:** `client/src/index.css` — replace with:
```css
@import "tailwindcss";

@theme {
  --color-surface: #1A1817;
  --color-card: #242120;
  --color-bubble-sent: rgba(200, 121, 65, 0.2);
  --color-accent: #C87941;
  --color-accent-hover: #B06830;
  --color-text-primary: #F0EDEA;
  --color-text-secondary: #8B8580;
  --color-border: #2D2926;
  --color-online: #4CAF50;
  --font-serif: "Instrument Serif", serif;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --animate-message-in: messageIn 200ms ease-out;
  --animate-fade-in: fadeIn 150ms ease-out;
  --animate-bounce-dot: bounce 1s ease-in-out infinite;
}

[data-theme='light'] {
  --color-surface: #F8F6F3;
  --color-card: #FFFFFF;
  --color-bubble-sent: rgba(200, 121, 65, 0.12);
  --color-accent: #C87941;
  --color-accent-hover: #B06830;
  --color-text-primary: #1A1817;
  --color-text-secondary: #8B8580;
  --color-border: #E8E4DF;
  --color-online: #4CAF50;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body { min-height: 100dvh; }
#root { height: 100dvh; display: flex; flex-direction: column; }

@keyframes messageIn { ... }
@keyframes bounce { ... }
@keyframes fadeIn { ... }
@media (max-width: 767px) { .sidebar { width: 100% !important; border-right: none !important; } }
```

### Step 7 — Migrate all 14 components to Tailwind classes

Replace `style={{...}}` with `className` strings using `@theme` tokens:
```tsx
// Before
<div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface)' }}>
// After
<div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface">
```

**Files:** TopBar, ChatLayout, Sidebar, ConversationList, ConversationItem, UserSearch, ConversationHeader, MessageWindow, MessageBubble, MessageInput, TypingIndicator, ProtectedRoute, AuthPage, ChatPage.

### Step 8 — Responsive sidebar overlay

**File:** `client/src/components/ChatLayout.tsx`
- Mobile sidebar as fixed overlay with backdrop
- `mobileSidebarOpen` state
- Close on selection or backdrop tap

**File:** `client/src/components/Sidebar.tsx`
- Accept `onClose?: () => void`

### Step 9 — Verify full build

```bash
npx tsc --noEmit && npx vite build
```

### Step 10 — Update AGENTS.md with Tailwind v4 note

### Step 11 — End-to-end test

Two browser tabs, two users, full send/receive/typing/responsive flow.
