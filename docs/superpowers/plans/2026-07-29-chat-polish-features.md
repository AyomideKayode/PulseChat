# PulseChat Polish Features — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 7 polish features to PulseChat client: ESC to close, Sonner toast notifications, skeleton loaders, Web Audio notification sounds, optimistic message sending, tab-based sidebar, and profile modal.

**Architecture:** All changes are client-only. No backend modifications. Features are independent with Toast notifications being the only dependency (used by optimistic messages for error display).

**Tech Stack:** React 19, TypeScript, Tailwind v4, `sonner` (new), Web Audio API, Lucide icons.

## Global Constraints

- All styles must use Tailwind v4 semantic tokens (`bg-surface`, `text-text-primary`, `border-border`, `font-sans`, `font-serif`, etc.)
- No inline `style={{...}}` except for dynamic computed values (e.g., avatar color from hash)
- TypeScript strict mode, no `any`, explicit return types
- Sonner toast colors: success = `#C87941` (accent), error = `#C94A4A` (warm brick-red)

---

### Task 1: ESC to Close Conversation

**Files:**

- Modify: `client/src/pages/ChatPage.tsx`

- [ ] **Add ESC keydown listener to ChatPage**

Insert a new `useEffect` after the StrictMode guard effect (line 37), before the `useMessages` hook:

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

- [ ] **Verify build passes**

Run: `npm run build --prefix client`
Expected: Build succeeds with no errors.

- [ ] **Commit**

```bash
git add client/src/pages/ChatPage.tsx
git commit -m "feat(chat): close conversation on Escape key"
```

---

### Task 2: Toast Notifications (Sonner)

**Files:**

- Install: `sonner`
- Modify: `client/src/App.tsx`
- Modify: `client/src/services/api.ts`
- Modify: `client/src/pages/AuthPage.tsx`

- [ ] **Install sonner**

Run: `npm install sonner --prefix client`

- [ ] **Mount Toaster in App.tsx**

Add import and `<Toaster />` inside `<AuthProvider>`, before `<Routes>`:

```diff
  import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
+ import { Toaster } from 'sonner';
  import AuthPage from './pages/AuthPage';
  ...

  function App() {
    return (
      <BrowserRouter>
        <AuthProvider>
+         <Toaster
+           richColors
+           position="bottomCenter"
+           toastOptions={{
+             style: {
+               background: '#242120',
+               border: '1px solid #2D2926',
+               color: '#F0EDEA',
+             },
+           }}
+         />
          <Routes>
            ...
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    );
  }
```

- [ ] **Add global error toast to api.ts**

Import `toast` from `sonner` and show error in the catch handler of `request`:

```diff
+ import { toast } from 'sonner';

  async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Request failed' }));
+     toast.error(error.message ?? 'Request failed');
      throw new Error(error.message ?? 'Request failed');
    }

    return res.json() as Promise<T>;
  }
```

- [ ] **Add success toast to AuthPage on login/signup**

In `client/src/pages/AuthPage.tsx`, import `toast` from `sonner` and add toasts after successful auth:

```diff
+ import { toast } from 'sonner';

  // Inside the signup handler, after successful response:
+ toast.success('Account created successfully!');

  // Inside the login handler, after successful response:
+ toast.success('Welcome back!');
```

- [ ] **Verify build passes**

Run: `npm run build --prefix client`
Expected: Build succeeds with no errors.

- [ ] **Commit**

```bash
git add client/package.json client/src/App.tsx client/src/services/api.ts
git commit -m "feat(chat): add sonner toast notifications with custom colors"
```

---

### Task 3: Skeleton Loaders

**Files:**

- Create: `client/src/components/ConversationSkeleton.tsx`
- Create: `client/src/components/MessageSkeleton.tsx`
- Modify: `client/src/components/ConversationList.tsx`
- Modify: `client/src/components/MessageWindow.tsx`

- [ ] **Create ConversationSkeleton.tsx**

```typescript
export default function ConversationSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-9 w-9 rounded-full bg-card shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 shimmer animate-shimmer" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 rounded bg-card relative overflow-hidden">
              <div className="absolute inset-0 shimmer animate-shimmer" />
            </div>
            <div className="h-2.5 w-44 rounded bg-card relative overflow-hidden">
              <div className="absolute inset-0 shimmer animate-shimmer" />
            </div>
          </div>
          <div className="h-2.5 w-8 rounded bg-card relative overflow-hidden">
            <div className="absolute inset-0 shimmer animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Create MessageSkeleton.tsx**

```typescript
export default function MessageSkeleton() {
  const items = Array.from({ length: 4 }).map((_, i) => {
    const isOwn = i % 2 === 0;
    return { isOwn, width: Math.random() * 30 + 30 };
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          className={`flex ${item.isOwn ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className="h-12 rounded-xl relative overflow-hidden"
            style={{ width: `${item.width}%` }}
          >
            <div
              className={`absolute inset-0 ${item.isOwn ? 'bg-bubble-sent/50' : 'bg-card'}`}
            >
              <div className="absolute inset-0 shimmer animate-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Add shimmer animation to index.css**

Append to `client/src/index.css`:

```css
@keyframes shimmer {
  0% {
    transform: translateX(-100%) skewX(-15deg);
  }
  100% {
    transform: translateX(200%) skewX(-15deg);
  }
}

.shimmer {
  background: linear-gradient(105deg, transparent 0%, #2d2926 40%, transparent 80%);
}

:root:not([data-theme='light']) .shimmer {
  background: linear-gradient(105deg, transparent 0%, #2d2926 40%, transparent 80%);
}
```

- [ ] **Update ConversationList to use skeleton**

Replace the loading branch:

```diff
  if (loading) {
    return (
-     <p className="p-5 text-text-secondary text-center">Loading...</p>
+     <ConversationSkeleton />
    );
  }
```

Add import:

```diff
+ import ConversationSkeleton from './ConversationSkeleton';
```

- [ ] **Update MessageWindow to use skeleton**

Replace the loading branch:

```diff
  {loading && (
-   <p className="text-center text-text-secondary p-5">Loading...</p>
+   <MessageSkeleton />
  )}
```

Add import:

```diff
+ import MessageSkeleton from './MessageSkeleton';
```

- [ ] **Verify build passes**

Run: `npm run build --prefix client`
Expected: Build succeeds with no errors.

- [ ] **Commit**

```bash
git add client/src/components/ConversationSkeleton.tsx client/src/components/MessageSkeleton.tsx client/src/components/ConversationList.tsx client/src/components/MessageWindow.tsx client/src/index.css
git commit -m "feat(chat): add warm-toned skeleton loaders for conversation list and messages"
```

---

### Task 4: Notification Sounds (Web Audio API)

**Files:**

- Create: `client/src/lib/sound.ts`
- Create: `client/src/hooks/useSoundToggle.ts`
- Create: `client/src/components/SoundToggle.tsx`
- Modify: `client/src/contexts/SocketContext.tsx`
- Modify: `client/src/components/TopBar.tsx`

- [ ] **Create sound.ts**

```typescript
let audioCtx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function playMessageChime() {
  try {
    const ctx = getContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
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
  } catch {
    // Audio not available — silent fail
  }
}
```

- [ ] **Create useSoundToggle.ts**

```typescript
import { useState, useCallback } from 'react';

export function useSoundToggle() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    () => localStorage.getItem('soundEnabled') !== 'false',
  );

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('soundEnabled', String(next));
      return next;
    });
  }, []);

  return { soundEnabled, toggleSound };
}
```

- [ ] **Create SoundToggle.tsx**

```typescript
import { Volume2, VolumeX } from 'lucide-react';
import { useSoundToggle } from '../hooks/useSoundToggle';

export default function SoundToggle() {
  const { soundEnabled, toggleSound } = useSoundToggle();

  return (
    <button
      onClick={toggleSound}
      className="p-2 rounded-lg border-none text-text-secondary cursor-pointer flex items-center justify-center hover:text-accent transition-colors duration-200"
      title={soundEnabled ? 'Sound on' : 'Sound off'}
    >
      {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  );
}
```

- [ ] **Integrate sound into SocketContext**

Add `playMessageChime` import and call it inside the `new_message` listener:

```diff
  import { useAuth } from './AuthContext';
+ import { playMessageChime } from '../lib/sound';
+ import { useSoundToggle } from '../hooks/useSoundToggle';

  export function SocketProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
+   const { soundEnabled } = useSoundToggle();
    const socketRef = useRef<TypedSocket | null>(null);
    ...

    socket.on('new_message', (message) => {
+     if (soundEnabled) {
+       playMessageChime();
+     }
      // existing handler (if any)
    });
```

Note: Since `SocketContext` doesn't currently listen for `new_message` (that's done in `ChatPage`), we need to add this listener here for the sound. The `ChatPage` listener handles adding the message to the UI.

- [ ] **Add SoundToggle to TopBar**

```diff
  import { useAuth } from '../contexts/AuthContext';
+ import SoundToggle from './SoundToggle';

  // Inside the header, after the theme toggle button:
+ <SoundToggle />
```

- [ ] **Verify build passes**

Run: `npm run build --prefix client`
Expected: Build succeeds with no errors.

- [ ] **Commit**

```bash
git add client/src/lib/sound.ts client/src/hooks/useSoundToggle.ts client/src/components/SoundToggle.tsx client/src/contexts/SocketContext.tsx client/src/components/TopBar.tsx
git commit -m "feat(chat): add heartbeat notification sound via Web Audio API"
```

---

### Task 5: Optimistic Message Sending

**Files:**

- Modify: `client/src/types/message.types.ts`
- Modify: `client/src/pages/ChatPage.tsx`
- Modify: `client/src/components/MessageBubble.tsx`

- [ ] **Add isOptimistic to IMessage type**

```diff
  export interface IMessage {
    _id: string;
    ...
    status: MessageStatus;
+   isOptimistic?: boolean;
    createdAt: string;
    updatedAt: string;
  }
```

- [ ] **Update handleSend in ChatPage for optimistic messages**

Replace the existing `handleSend` implementation:

```typescript
const handleSend = useCallback(
  (text?: string, image?: string) => {
    if (!otherUserId || !socket) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: IMessage = {
      _id: tempId,
      senderId: user!._id,
      receiverId: otherUserId,
      text,
      image,
      status: MessageStatus.Sent,
      isOptimistic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addMessage(optimisticMessage);

    socket.emit('send_message', { receiverId: otherUserId, text, image }, (res) => {
      if (res.success && res.message) {
        addMessage(res.message);
      } else {
        toast.error('Message failed to send');
      }
    });
  },
  [otherUserId, socket, addMessage, user],
);
```

Add import for `toast` and `MessageStatus`:

```diff
  import type { IConversation, IMessage } from '../types/message.types';
+ import { MessageStatus } from '../types/message.types';
+ import { toast } from 'sonner';
```

- [ ] **Update MessageBubble for optimistic styling**

In `MessageBubble.tsx`, add conditional class for optimistic message:

```diff
  <div
-   className={`max-w-[70%] px-3.5 py-2.5 rounded-xl ${isOwn ? 'bg-bubble-sent' : 'bg-card'} text-text-primary`}
+   className={`max-w-[70%] px-3.5 py-2.5 rounded-xl ${isOwn ? 'bg-bubble-sent' : 'bg-card'} text-text-primary ${message.isOptimistic ? 'animate-pulse-border' : ''}`}
  >
```

Add the pulsing border animation to `index.css`:

```css
@keyframes pulse-border {
  0%,
  100% {
    box-shadow: inset 0 0 0 1px transparent;
  }
  50% {
    box-shadow: inset 0 0 0 1px #c87941;
  }
}

.animate-pulse-border {
  animation: pulse-border 1.2s ease-in-out infinite;
}
```

- [ ] **Verify build passes**

Run: `npm run build --prefix client`
Expected: Build succeeds with no errors.

- [ ] **Commit**

```bash
git add client/src/types/message.types.ts client/src/pages/ChatPage.tsx client/src/components/MessageBubble.tsx client/src/index.css
git commit -m "feat(chat): optimistic message sending with pulsing copper border"
```

---

### Task 6: Tab-Based Sidebar

**Files:**

- Create: `client/src/components/ContactsList.tsx`
- Modify: `client/src/components/Sidebar.tsx`
- Remove: `client/src/components/UserSearch.tsx`

- [ ] **Create ContactsList.tsx**

```typescript
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import type { IUser } from '../types/auth.types';
import type { IConversation } from '../types/message.types';

const AVATAR_COLORS = ['#C87941', '#C49B6C', '#B07D5E', '#A67C52'];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? '#C87941';
}

interface Props {
  onSelectUser: (conversation: IConversation) => void;
}

export default function ContactsList({ onSelectUser }: Props) {
  const [contacts, setContacts] = useState<IUser[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { onlineUsers } = useSocket();

  useEffect(() => {
    api.get<IUser[]>('/messages/contacts')
      .then(setContacts)
      .finally(() => setLoading(false));
  }, []);

  const filtered = contacts.filter((u) =>
    u.fullName.toLowerCase().includes(query.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <div className="h-9 w-9 rounded-full bg-card shrink-0" />
            <div className="h-3 w-24 rounded bg-card" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-3 pt-2 pb-1">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface">
          <Search size={14} className="text-text-secondary shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter contacts..."
            className="flex-1 bg-transparent border-none text-text-primary text-sm outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((u) => {
          const initials = u.fullName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          const isOnline = onlineUsers.has(u._id);
          return (
            <button
              key={u._id}
              onClick={async () => {
                try {
                  const conversation = await api.post<IConversation>(`/conversations/${u._id}`);
                  onSelectUser(conversation);
                } catch {
                  // Toast handles error
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 border-none bg-transparent text-text-primary cursor-pointer rounded-lg text-left hover:bg-card transition-colors"
            >
              <div className="relative shrink-0">
                <div
                  style={{ background: getAvatarColor(u._id) }}
                  className="h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                >
                  {initials}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface ${isOnline ? 'bg-online' : 'bg-text-secondary'}`}
                />
              </div>
              <span className="text-sm">{u.fullName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Update Sidebar.tsx with tabs**

Replace the entire file:

```typescript
import { useState } from 'react';
import ConversationList from './ConversationList';
import ContactsList from './ContactsList';
import { useConversations } from '../hooks/useConversations';
import { useSocket } from '../contexts/SocketContext';
import type { IConversation } from '../types/message.types';

interface Props {
  activeId: string | null;
  onSelectConversation: (c: IConversation) => void;
}

type Tab = 'chats' | 'contacts';

export default function Sidebar({ activeId, onSelectConversation }: Props) {
  const { socket } = useSocket();
  const { conversations, loading, refetch } = useConversations(socket);
  const [tab, setTab] = useState<Tab>('chats');

  return (
    <aside className="sidebar w-85 border-r border-border flex flex-col bg-surface">
      <div className="flex px-4 pt-3 pb-0 gap-5">
        <button
          onClick={() => setTab('chats')}
          className={`font-serif text-lg border-none bg-transparent cursor-pointer pb-1 transition-colors duration-200 ${
            tab === 'chats'
              ? 'text-accent border-b-2 border-accent'
              : 'text-text-secondary border-b-2 border-transparent hover:text-text-primary'
          }`}
        >
          Chats
        </button>
        <button
          onClick={() => setTab('contacts')}
          className={`font-serif text-lg border-none bg-transparent cursor-pointer pb-1 transition-colors duration-200 ${
            tab === 'contacts'
              ? 'text-accent border-b-2 border-accent'
              : 'text-text-secondary border-b-2 border-transparent hover:text-text-primary'
          }`}
        >
          Contacts
        </button>
      </div>
      <div className="h-px bg-border mx-4 mt-0" />
      {tab === 'chats' ? (
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={(c) => {
            onSelectConversation(c);
            refetch();
          }}
          loading={loading}
        />
      ) : (
        <ContactsList
          onSelectUser={(conversation) => {
            onSelectConversation(conversation);
            refetch();
          }}
        />
      )}
    </aside>
  );
}
```

- [ ] **Remove UserSearch.tsx**

```bash
rm client/src/components/UserSearch.tsx
```

- [ ] **Verify build passes**

Run: `npm run build --prefix client`
Expected: Build succeeds with no errors.

- [ ] **Commit**

```bash
git add client/src/components/ContactsList.tsx client/src/components/Sidebar.tsx
git rm client/src/components/UserSearch.tsx
git commit -m "feat(chat): replace UserSearch modal with Chats/Contacts tab sidebar"
```

---

### Task 7: Profile Header Modal

**Files:**

- Create: `client/src/components/ProfileModal.tsx`
- Modify: `client/src/components/ConversationHeader.tsx`

- [ ] **Create ProfileModal.tsx**

```typescript
import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { IUser } from '../types/auth.types';

const AVATAR_COLORS = ['#C87941', '#C49B6C', '#B07D5E', '#A67C52'];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? '#C87941';
}

interface Props {
  user: IUser;
  onClose: () => void;
}

export default function ProfileModal({ user, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const joined = new Date(user.createdAt ?? Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/50" />
      <div
        className="relative bg-card rounded-xl p-6 w-80 max-w-[90vw] shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-transparent border-none text-text-secondary cursor-pointer p-1 flex"
        >
          <X size={18} />
        </button>
        <div
          style={{ background: getAvatarColor(user._id) }}
          className="h-20 w-20 rounded-full flex items-center justify-center text-white font-semibold text-2xl"
        >
          {initials}
        </div>
        <h2 className="font-serif text-xl text-text-primary">{user.fullName}</h2>
        <p className="text-sm text-text-secondary">{user.email}</p>
        <p className="text-xs text-text-secondary">Joined {joined}</p>
      </div>
    </div>
  );
}
```

- [ ] **Update ConversationHeader with click-to-open**

Add modal state and open handler:

```diff
  import { ArrowLeft } from 'lucide-react';
+ import { useState } from 'react';
  import { useSocket } from '../contexts/SocketContext';
  import type { IConversation } from '../types/message.types';
  import { useAuth } from '../contexts/AuthContext';
  import { useMobile } from '../contexts/MobileContext';
+ import ProfileModal from './ProfileModal';

  ...

  export default function ConversationHeader({ conversation, onBack }: Props) {
    const { onlineUsers } = useSocket();
    const { user } = useAuth();
    const { isMobile } = useMobile();
+   const [showProfile, setShowProfile] = useState(false);

    const other = conversation.participants.find((p) => p._id !== user?._id) ?? conversation.participants[0];
    const isOnline = other ? onlineUsers.has(other._id) : false;

    ...

    return (
+     <>
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          {isMobile && (
            <button onClick={handleBack} className="bg-transparent border-none text-text-secondary cursor-pointer p-1 flex">
              <ArrowLeft size={20} />
            </button>
          )}
-         <div>
+         <button onClick={() => setShowProfile(true)} className="bg-transparent border-none text-left cursor-pointer">
            <p className="font-semibold text-[0.9375rem]">{other?.fullName ?? 'Unknown'}</p>
            <p className={`text-xs ${isOnline ? 'text-online' : 'text-text-secondary'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </p>
-         </div>
+         </button>
        </div>
+       {showProfile && other && (
+         <ProfileModal user={other} onClose={() => setShowProfile(false)} />
+       )}
+     </>
    );
  }
```

- [ ] **Verify build passes**

Run: `npm run build --prefix client`
Expected: Build succeeds with no errors.

- [ ] **Commit**

```bash
git add client/src/components/ProfileModal.tsx client/src/components/ConversationHeader.tsx
git commit -m "feat(chat): add profile modal on conversation header click"
```

---

### Final Verification

- [ ] **Run full client build**

```bash
npm run build --prefix client
```

Expected: All modules compile, no errors.

- [ ] **Run ESLint**

```bash
npx eslint . --prefix client
```

Expected: No lint errors.

- [ ] **Run full server build**

```bash
npm run build --prefix server
```

Expected: Server build passes (no changes to server code, verify no regressions).
