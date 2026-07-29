# PulseChat Polish Features

> Design spec for phase 3 polish — notification sounds, toast feedback, skeleton loaders, optimistic messages, tab sidebar, and profile header.

---

## 1. Notification Sounds

**Goal:** A subtle audio chime when a new message arrives from the currently selected conversation partner.

**Approach:** Web Audio API synthesis — no audio files, no dependencies. Generate a short warm chime (two-tone sine wave with envelope) at the moment a new message is received.

```typescript
// synth: two ascending tones, ~300ms, soft decay
function playMessageChime() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(660, ctx.currentTime);
  osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}
```

**Toggle:** A speaker icon button in the sidebar header (`TopBar` or sidebar). State persisted in `localStorage` under key `soundEnabled`. Default: `true`.

**File changes:**
- `client/src/lib/sound.ts` — `playMessageChime()` factory
- `client/src/hooks/useSoundToggle.ts` — `{ soundEnabled, toggleSound }` with localStorage
- `client/src/contexts/SocketContext.tsx` — conditionally call `playMessageChime()` on `new_message`
- `client/src/components/SoundToggle.tsx` — speaker icon button
- `client/src/components/TopBar.tsx` — embed toggle

---

## 2. Toast Notifications

**Goal:** Replace silent failures and inline error text with unobtrusive toast notifications for success/error flows.

**Library:** `sonner` (~3KB, lightweight, accessible, no dependencies).

**Usage:**
- API errors (caught in `api.ts` interceptor or per-call): `toast.error('Failed to load conversations')`
- Success feedback: `toast.success('Message sent')` — subtle, auto-dismiss
- No toast for expected empty states or loading

**Placement:** Bottom-center, dark theme styling via `<Toaster richColors position="bottomCenter" />` in `App.tsx`.

**File changes:**
- Install `sonner`
- `client/src/App.tsx` — mount `<Toaster />`
- `client/src/services/api.ts` — global error toast in catch handler
- `client/src/pages/AuthPage.tsx` — success toasts on login/signup
- `client/src/components/UserSearch.tsx` — replace inline error with toast.error
- `client/src/hooks/useConversations.ts` — optional error toast on fetch failure

---

## 3. Skeleton Loaders

**Goal:** Replace "Loading..." text with animated placeholder shapes that match final content layout.

**Two skeletons:**

### `ConversationSkeleton.tsx`
- 5 rows, each mimicking `ConversationItem`: circular avatar (36px) + two text lines (name + preview) + date
- Shimmer animation: `bg-gradient-to-r` sweep across gray blocks

### `MessageSkeleton.tsx`
- 4 alternating left/right blocks mimicking `MessageBubble`: rounded container (left: card color, right: sent-bubble color)
- Same shimmer animation as ConversationSkeleton

**Animation:** Pure CSS — `@keyframes shimmer` with a `translateX` sweep. Already in the Tailwind config pattern.

**File changes:**
- `client/src/components/ConversationSkeleton.tsx`
- `client/src/components/MessageSkeleton.tsx`
- `client/src/components/ConversationList.tsx` — use skeleton when loading
- `client/src/components/MessageWindow.tsx` — use skeleton when loading

---

## 4. Optimistic Message Sending

**Goal:** Show sent message immediately in the UI before the server confirms, eliminating perceived latency.

**Flow:**
1. `handleSend` creates a temporary message object with `_id: temp-${Date.now()}`, all visible fields populated from local state
2. Add temp message to the messages array immediately (via `addMessage` or direct state append)
3. Emit `send_message` via socket as before
4. On ack success (`res.success && res.message`): replace temp message in the array with the server-returned message (match by `senderId + createdAt` or temp id field)
5. On ack failure: remove temp message and show `toast.error('Message failed to send')`

**Optimistic flag:** Add optional `isOptimistic?: boolean` to `IMessage` type. `MessageBubble` renders optimistic messages with `opacity-60` and a tiny "Sending..." label.

**Backward compatibility:** Server returns the same ack payload. No server changes needed.

**File changes:**
- `client/src/types/message.types.ts` — add `isOptimistic?: boolean`
- `client/src/pages/ChatPage.tsx` — `handleSend` creates temp + replaces on ack
- `client/src/components/MessageBubble.tsx` — apply `opacity-60` for optimistic messages

---

## 5. ESC to Close Conversation

**Goal:** Pressing Escape when a conversation is active deselects it (returns to empty state).

**Approach:** `useEffect` in `ChatPage.tsx` with `keydown` listener:

```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && activeConversation) {
      handleBack();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [activeConversation, handleBack]);
```

**File changes:**
- `client/src/pages/ChatPage.tsx` — one effect

---

## 6. Tab-Based Sidebar

**Goal:** Replace the UserSearch modal with a persistent "Chats | Contacts" tab bar in the sidebar, showing conversations and contacts inline.

**Layout:**
- Two tabs at the top of the sidebar: **Chats** (default) and **Contacts**
- **Chats tab:** Shows the existing `ConversationList` (no change)
- **Contacts tab:** Shows all users who are not the current user, with a "+" or click-to-chat action. Same filtering/search as UserSearch but inline

**Tab component:** `TabSwitch` — two pill-shaped buttons (`Tab1 | Tab2`), active state gets accent fill.

**Contacts list:** Reuses the contacts fetch (`GET /messages/contacts`) already used by UserSearch. Each contact row shows avatar + name + online dot. Clicking creates/opens a conversation (same `POST /conversations/:userId` logic).

**Removal:** UserSearch modal is replaced by the Contacts tab. The search within Contacts is a text filter on the list (already exists in UserSearch — port to inline filter input).

**File changes:**
- `client/src/components/TabSwitch.tsx` — new
- `client/src/components/ContactsList.tsx` — new (adapted from UserSearch inline)
- `client/src/components/Sidebar.tsx` — wrap ConversationList + ContactsList in tab logic
- `client/src/components/UserSearch.tsx` — remove (fully replaced)
- `client/src/components/TopBar.tsx` — option for sound toggle placement

---

## 7. Profile Header

**Goal:** Clicking the other user's avatar or name in `ConversationHeader` opens a slide-over or modal showing their full profile info.

**Profile content:** Full name, email, profile picture (large), "Joined" date (from `createdAt` on User model).

**Trigger:** Click handler on the avatar/name area in `ConversationHeader`.

**Presentation:** A centered modal (same pattern as UserSearch's overlay) with the profile card. Close on backdrop click or ESC.

**File changes:**
- `client/src/components/ProfileModal.tsx` — new
- `client/src/components/ConversationHeader.tsx` — add onClick that opens modal, pass `otherUser` data

---

## Implementation Order

| # | Feature | Dependencies | Effort |
|---|---------|-------------|--------|
| 1 | ESC to close | None | ~5 min |
| 2 | Toast notifications | `sonner` install | ~15 min |
| 3 | Skeleton loaders | Toast system (for error toasts) | ~20 min |
| 4 | Notification sounds | Toast system | ~15 min |
| 5 | Optimistic messages | Toast system | ~25 min |
| 6 | Tab sidebar | None (replaces UserSearch) | ~30 min |
| 7 | Profile header | None | ~20 min |

All features are additive — no backend changes required.
