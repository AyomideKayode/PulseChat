# PulseChat Polish Features

> Design spec for phase 3 polish — notification sounds, toast feedback, skeleton loaders, optimistic messages, tab sidebar, and profile header.
> All visual decisions grounded in PulseChat's existing identity: heartbeat metaphor, warm copper (`#C87941`) on charcoal (`#1A1817`), Instrument Serif display, Inter body, signature avatar system.

---

## 1. Notification Sounds

**Goal:** A subtle audio cue when a new message arrives from the currently selected conversation partner.

**Design note:** This is the single biggest opportunity to reinforce the PulseChat brand. A generic "ding" would be indistinguishable from every other chat app. Instead, the sound IS the heartbeat — two soft, warm-toned thumps at ~120 BPM, synthesized with a rounded sine wave (low-pass, not bright). Low gain, short decay. Feels like a nudge, not an alert. The sound embodies the app name rather than just being a notification.

**Approach:** Web Audio API synthesis — no audio files, no dependencies.

```typescript
// synth: heartbeat thump — two low tones, ~300ms, soft decay
function playMessageChime() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, ctx.currentTime);
  osc.frequency.setValueAtTime(240, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.35);
}
```

**Toggle:** State persisted in `localStorage` under key `soundEnabled`. Default: `true`.

The toggle icon should NOT be a generic speaker. Use a small heartbeat/pulse icon (simple line waveform) that's immediately recognizable as PulseChat's own. Place it in TopBar next to the theme toggle — small, intentional, doesn't shout.

**File changes:**

- `client/src/lib/sound.ts` — `playMessageChime()` factory
- `client/src/hooks/useSoundToggle.ts` — `{ soundEnabled, toggleSound }` with localStorage
- `client/src/contexts/SocketContext.tsx` — conditionally call `playMessageChime()` on `new_message`
- `client/src/components/SoundToggle.tsx` — heartbeat icon button
- `client/src/components/TopBar.tsx` — embed toggle

---

## 2. Toast Notifications

**Goal:** Replace silent failures and inline error text with unobtrusive toast notifications for success/error flows.

**Library:** `sonner` (~3KB, lightweight, accessible, no dependencies).

**Design note:** Default sonner green/red would clash with the copper palette. Custom colors: success uses `accent` (`#C87941`), error uses warm brick-red (`#C94A4A`). Toast card uses `card` bg (`#242120`) with the accent color on a left border bar. Bottom-center, subtle slide-up, auto-dismiss 3s.

**Usage:**

- API errors (caught in `api.ts` interceptor or per-call): `toast.error('Failed to load conversations')`
- Success feedback: `toast.success('Message sent')` — subtle, auto-dismiss
- No toast for expected empty states or loading

**Styling:** `<Toaster richColors position="bottomCenter" />` in `App.tsx`. Override sonner's default theme colors to match PulseChat's palette.

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

**Design note:** The shimmer highlight should use a warm tone, not cold white. Skeleton shapes mirror the actual bubble/conversation contours (rounded, organic-feeling). The sweep direction is diagonal (not horizontal) — subtle difference that avoids the generic "loading block" feel.

**Two skeletons:**

### `ConversationSkeleton.tsx`

- 5 rows, each mimicking `ConversationItem`: circular avatar (36px, `card` bg) + two text lines (name + preview) + date
- Shimmer: warm-toned gradient sweep (`card` → `#2D2926` → `card`)

### `MessageSkeleton.tsx`

- 4 alternating left/right blocks mimicking `MessageBubble`: rounded container (left: `card` color, right: `bubble-sent` color at low opacity)
- Same warm shimmer animation

**Animation:** Pure CSS — `@keyframes shimmer` with a `translateX` sweep on a pseudo-element.

**File changes:**

- `client/src/components/ConversationSkeleton.tsx`
- `client/src/components/MessageSkeleton.tsx`
- `client/src/components/ConversationList.tsx` — use skeleton when loading
- `client/src/components/MessageWindow.tsx` — use skeleton when loading

---

## 4. Optimistic Message Sending

**Goal:** Show sent message immediately in the UI before the server confirms, eliminating perceived latency.

**Design note:** Stock approach is dimming the message (`opacity-60`) with "Sending..." — that's the generic move. PulseChat's approach ties into the heartbeat metaphor. Instead of dimming, show the message at full opacity with a **subtle pulsing border** — a 1px copper (`#C87941`) ring that fades in/out on a ~1.2s loop. When the server confirms, the pulsing stops. The message was *pulsing* (alive, in transit), then it lands and goes still.

**Flow:**

1. `handleSend` creates a temporary message object with `_id: temp-${Date.now()}`, all visible fields populated from local state
2. Add temp message to the messages array immediately (via `addMessage` or direct state append)
3. Emit `send_message` via socket as before
4. On ack success (`res.success && res.message`): replace temp message in the array with the server-returned message (match by temp id)
5. On ack failure: remove temp message and show `toast.error('Message failed to send')`

**Optimistic flag:** Add optional `isOptimistic?: boolean` to `IMessage` type. `MessageBubble` renders optimistic messages with an animated pulsing copper border (and no "Sending..." label — the pulse IS the indicator).

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

**Design note:** Avoid pill-shaped tab buttons (the generic AI move). Use clean text labels in Instrument Serif (PulseChat's signature display face) with a thin copper underline on the active tab — underline animates in with a fade/width transition. The tabs sit above a hairline border divider. This keeps the sidebar feeling typographic and intentional rather than like a standard component library.

**Layout:**

- Two text labels at the top of the sidebar: **Chats** (default) and **Contacts** in Instrument Serif
- Active tab gets a 2px copper (`#C87941`) underline that animates in
- **Chats tab:** Shows the existing `ConversationList` (no change)
- **Contacts tab:** Shows all users who are not the current user, with avatar + name + online dot. Clicking creates/opens a conversation (same `POST /conversations/:userId` logic)

**Tab component:** Minimal — two `<button>` elements, no pill background, just text + underline indicator.

**Contacts list:** Reuses the contacts fetch (`GET /messages/contacts`) already used by UserSearch. Each contact row uses the same avatar signature (initials on warm-toned circle + online dot). Inline text filter at the top of the tab.

**Removal:** UserSearch modal is replaced by the Contacts tab. The search within Contacts is a text filter on the list.

**File changes:**

- `client/src/components/TabSwitch.tsx` — new
- `client/src/components/ContactsList.tsx` — new (adapted from UserSearch inline)
- `client/src/components/Sidebar.tsx` — wrap ConversationList + ContactsList in tab logic
- `client/src/components/UserSearch.tsx` — remove (fully replaced)
- `client/src/components/TopBar.tsx` — option for sound toggle placement

---

## 7. Profile Header

**Goal:** Clicking the other user's avatar or name in `ConversationHeader` opens a centered modal showing their full profile info.

**Design note:** The avatar system is PulseChat's signature element. The profile modal should lean into it. Large avatar (80px) with the warm-toned initials circle, name in Instrument Serif (display role), email and "Joined" date in Inter (body), secondary text in `text-secondary`. The same modal pattern as the existing UserSearch overlay — backdrop click or X to close. No slide-overs, no drawers — stays consistent with the existing interaction pattern.

**Profile content:** Full name (Instrument Serif), email, profile picture large (80px, initials on warm-toned circle), "Joined" date.

**Trigger:** Click handler on the avatar/name area in `ConversationHeader`.

**Presentation:** Centered modal overlay (same pattern as UserSearch's design — same backdrop, same card radius, same padding). Close on backdrop click, X button, or ESC.

**File changes:**

- `client/src/components/ProfileModal.tsx` — new
- `client/src/components/ConversationHeader.tsx` — add onClick that opens modal, pass `otherUser` data

---

## Implementation Order

| #   | Feature             | Dependencies                    | Effort  |
| --- | ------------------- | ------------------------------- | ------- |
| 1   | ESC to close        | None                            | ~5 min  |
| 2   | Toast notifications | `sonner` install                | ~15 min |
| 3   | Skeleton loaders    | Toast system (for error toasts) | ~20 min |
| 4   | Notification sounds | Toast system                    | ~15 min |
| 5   | Optimistic messages | Toast system                    | ~25 min |
| 6   | Tab sidebar         | None (replaces UserSearch)      | ~30 min |
| 7   | Profile header      | None                            | ~20 min |

All features are additive — no backend changes required.
