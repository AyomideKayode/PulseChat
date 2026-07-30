# PulseChat Client UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the TypeScript React chat client connecting to the PulseChat server.

**Architecture:** React 19 + TypeScript + Vite frontend. Routing via react-router-dom v7. State via React Context (AuthContext, SocketContext). Socket.IO client for real-time. Plain CSS Modules for styling. Design follows `docs/superpowers/specs/pulsechat-client-design.md`.

**Tech Stack:** React 19, TypeScript, Vite 7, react-router-dom v7, socket.io-client, Lucide React, Google Fonts (Instrument Serif, Inter, JetBrains Mono)

---

## Global Constraints

- **TypeScript strict mode** — no `any`, explicit return types, matching server conventions
- **No state management library** — React Context + hooks only, as per project convention
- **Auth** — JWT in HTTP-only cookies (no localStorage), server handles token, client just sends `credentials: 'include'`
- **Socket.IO auth** — server reads JWT from handshake cookie, client doesn't touch the token
- **CSS** — Plain CSS Modules (`.module.css`), no CSS-in-JS or Tailwind
- **Theme** — Dark default, light companion, CSS custom properties on `:root` / `[data-theme="light"]`
- **Design reference** — Always consult `docs/superpowers/specs/pulsechat-client-design.md` for colors, typography, spacing, animations
- **Icons** — Lucide React
- **Fonts** — Google Fonts: Instrument Serif (400), Inter (400, 500, 600, 700), JetBrains Mono (400)

---

## File Structure

```
client/src/
├── types/
│   ├── auth.types.ts              # IUser, LoginPayload, SignupPayload
│   ├── message.types.ts           # IMessage, IConversation, MessageStatus
│   └── socket-events.types.ts     # ClientToServerEvents, ServerToClientEvents (mirrors server)
├── services/
│   ├── api.ts                     # Typed fetch wrapper with credentials: 'include'
│   └── socket.ts                  # Socket.IO client factory
├── contexts/
│   ├── AuthContext.tsx            # Auth state, login/signup/logout, session restore
│   └── SocketContext.tsx          # Socket lifecycle, onlineUsers, connected
├── hooks/
│   ├── useConversations.ts        # Fetch + live-update conversation list
│   ├── useMessages.ts             # Fetch history, paginate, append real-time
│   └── useTypingIndicator.ts      # Debounced emit + partner state
├── pages/
│   ├── AuthPage.tsx               # Login + Signup forms (toggled)
│   └── ChatPage.tsx               # Main chat layout (sidebar + messages)
├── components/
│   ├── ProtectedRoute.tsx         # Auth gate → redirect to /login
│   ├── ChatLayout.tsx             # Sidebar + MainPanel flex layout
│   ├── TopBar.tsx                 # Logo, app name, theme toggle, user menu
│   ├── Sidebar.tsx                # Search + ConversationList wrapper
│   ├── ConversationList.tsx       # Scrollable list of ConversationItems
│   ├── ConversationItem.tsx       # Avatar, name, preview, unread, dot
│   ├── UserSearch.tsx             # Search users, start conversation
│   ├── ConversationHeader.tsx     # Name, online dot, back button (mobile)
│   ├── MessageWindow.tsx          # Scrollable message list + pagination
│   ├── MessageBubble.tsx          # Single message (sent/received variants)
│   ├── TypingIndicator.tsx        # "User is typing..." animation
│   └── MessageInput.tsx           # Textarea, image upload, send button
├── App.tsx                        # Routes: /login, /signup, /
├── main.tsx                       # Entry point
├── index.css                      # Global styles + CSS custom properties (themes)
└── vite.config.ts                 # Vite config (proxy to server)
```

---

## Task 1: Project Scaffold & Theme System

**Files:**

- Create: `client/tsconfig.json`
- Modify: `client/vite.config.ts` (rename from `.js`, add proxy)
- Modify: `client/index.html` (add Google Fonts, title)
- Create: `client/src/index.css` (global styles + CSS custom properties)

- [ ] **Step 1: Install dependencies**

```bash
cd /home/ayomide/sandbox/PulseChat/client
npm install react-router-dom socket.io-client lucide-react
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "isolatedModules": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Rename vite.config.js → vite.config.ts and add proxy**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      '/socket.io': {
        target: 'http://localhost:8080',
        ws: true,
      },
    },
  },
});
```

- [ ] **Step 4: Update index.html with fonts and title**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PulseChat</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create index.css with theme system**

```css
:root {
  --surface: #1a1817;
  --card: #242120;
  --bubble-sent: rgba(200, 121, 65, 0.2);
  --accent: #c87941;
  --accent-hover: #b06830;
  --text-primary: #f0edea;
  --text-secondary: #8b8580;
  --border: #2d2926;
  --online: #4caf50;

  font-family: 'Inter', system-ui, sans-serif;
  color: var(--text-primary);
  background-color: var(--surface);
}

[data-theme='light'] {
  --surface: #f8f6f3;
  --card: #ffffff;
  --bubble-sent: rgba(200, 121, 65, 0.12);
  --accent: #c87941;
  --accent-hover: #b06830;
  --text-primary: #1a1817;
  --text-secondary: #8b8580;
  --border: #e8e4df;
  --online: #4caf50;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  min-height: 100dvh;
}

#root {
  height: 100dvh;
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 6: Rename main.jsx → main.tsx and App.jsx → App.tsx**

```tsx
// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

```tsx
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 7: Verify build**

```bash
cd /home/ayomide/sandbox/PulseChat/client
npx tsc --noEmit
```

Expected: Compiles with no errors.

- [ ] **Step 8: Commit**

```bash
git add client/tsconfig.json client/vite.config.ts client/index.html client/src/index.css client/src/main.tsx client/src/App.tsx
git commit -m "feat(client): scaffold TypeScript project with theme system and routing"
```

---

## Task 2: Client-Side Type Definitions

**Files:**

- Create: `client/src/types/auth.types.ts`
- Create: `client/src/types/message.types.ts`
- Create: `client/src/types/socket-events.types.ts`

- [ ] **Step 1: Create auth.types.ts**

```typescript
export interface IUser {
  _id: string;
  fullName: string;
  email: string;
  profilePicture: {
    url: string;
    publicId: string;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  fullName: string;
  email: string;
  password: string;
}
```

- [ ] **Step 2: Create message.types.ts**

```typescript
export enum MessageStatus {
  Sent = 'sent',
  Delivered = 'delivered',
  Read = 'read',
}

export interface IMessage {
  _id: string;
  senderId:
    | {
        _id: string;
        fullName: string;
        email: string;
        profilePicture: { url: string; publicId: string };
      }
    | string;
  receiverId:
    | {
        _id: string;
        fullName: string;
        email: string;
        profilePicture: { url: string; publicId: string };
      }
    | string;
  text?: string;
  image?: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IConversation {
  _id: string;
  participants: Array<{
    _id: string;
    fullName: string;
    email: string;
    profilePicture: { url: string; publicId: string };
  }>;
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessagePayload {
  receiverId: string;
  text?: string;
  image?: string;
}
```

- [ ] **Step 3: Create socket-events.types.ts**

```typescript
import type { IMessage } from './message.types';

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
    ack: (response: { success: boolean; message?: IMessage; error?: string }) => void,
  ) => void;
  mark_read: (
    data: { conversationId: string },
    ack: (response: { success: boolean }) => void,
  ) => void;
  typing_start: (data: { receiverId: string }) => void;
  typing_stop: (data: { receiverId: string }) => void;
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/types/
git commit -m "feat(client): add TypeScript type definitions"
```

---

## Task 3: Services Layer

**Files:**

- Create: `client/src/services/api.ts`
- Create: `client/src/services/socket.ts`

- [ ] **Step 1: Create api.ts**

Typed wrapper around fetch with `credentials: 'include'` so cookies are sent automatically.

```typescript
const BASE_URL = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  upload: <T>(endpoint: string, formData: FormData) =>
    fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(error.message ?? 'Upload failed');
      }
      return res.json() as Promise<T>;
    }),
};
```

- [ ] **Step 2: Create socket.ts**

```typescript
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/socket-events.types';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(): TypedSocket {
  return io('/', {
    withCredentials: true,
    autoConnect: false,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/services/
git commit -m "feat(client): add API and Socket.IO services"
```

---

## Task 4: Auth Context and Pages

**Files:**

- Create: `client/src/contexts/AuthContext.tsx`
- Create: `client/src/pages/AuthPage.tsx`
- Create: `client/src/components/ProtectedRoute.tsx`

- [ ] **Step 1: Create AuthContext**

```tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../services/api';
import type { IUser, LoginPayload, SignupPayload } from '../types/auth.types';

interface AuthContextValue {
  user: IUser | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: FormData) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<IUser>('/auth/check')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const u = await api.post<IUser>('/auth/login', payload);
    setUser(u);
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    const u = await api.post<IUser>('/auth/signup', payload);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: FormData) => {
    const u = await api.upload<IUser>('/auth/update-profile', data);
    setUser(u);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: Create AuthPage**

AuthPage renders LoginForm or SignupForm based on the current path. After auth, redirects to `/`.

```tsx
import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const isLogin = useLocation().pathname === '/login';
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await signup({ fullName, email, password });
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '24px',
        background: 'var(--surface)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: '2.5rem',
            color: 'var(--accent)',
            textAlign: 'center',
            marginBottom: '8px',
          }}
        >
          PulseChat
        </h1>
        {!isLogin && (
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            required
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--text-primary)',
              fontSize: '1rem',
            }}
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--card)',
            color: 'var(--text-primary)',
            fontSize: '1rem',
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          minLength={8}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--card)',
            color: 'var(--text-primary)',
            fontSize: '1rem',
          }}
        />
        {error && <p style={{ color: '#E74C3C', fontSize: '0.875rem' }}>{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: submitting ? 'var(--text-secondary)' : 'var(--accent)',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
        </button>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <Link to={isLogin ? '/signup' : '/login'} style={{ color: 'var(--accent)' }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Create ProtectedRoute**

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface)',
        }}
      >
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: '2rem',
            color: 'var(--accent)',
            opacity: 0.6,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          PulseChat
        </h1>
        <style>{'@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }'}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/contexts/AuthContext.tsx client/src/pages/AuthPage.tsx client/src/components/ProtectedRoute.tsx
git commit -m "feat(client): add auth context, login/signup page, and protected route"
```

---

## Task 5: Socket Context

**Files:**

- Create: `client/src/contexts/SocketContext.tsx`

- [ ] **Step 1: Create SocketContext**

```tsx
import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { createSocket, type TypedSocket } from '../services/socket';
import { useAuth } from './AuthContext';

interface SocketContextValue {
  socket: TypedSocket | null;
  connected: boolean;
  onlineUsers: Set<string>;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const socketRef = useRef<TypedSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      setOnlineUsers(new Set());
      return;
    }

    const socket = createSocket();
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('user_online', ({ userId }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });
    socket.on('user_offline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.connect();

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
```

- [ ] **Step 2: Wire SocketProvider in App.tsx**

Wrap `ProtectedRoute` content with `SocketProvider`. Add import.

```tsx
import { SocketProvider } from './contexts/SocketContext';
// ...
<Route
  path="/"
  element={
    <ProtectedRoute>
      <SocketProvider>
        <ChatPage />
      </SocketProvider>
    </ProtectedRoute>
  }
/>;
```

- [ ] **Step 3: Commit**

```bash
git add client/src/contexts/SocketContext.tsx client/src/App.tsx
git commit -m "feat(client): add socket context with presence tracking"
```

---

## Task 6: Main Chat Layout

**Files:**

- Create: `client/src/pages/ChatPage.tsx`
- Create: `client/src/components/ChatLayout.tsx`
- Create: `client/src/components/TopBar.tsx`
- Create: `client/src/components/Sidebar.tsx`
- Create: `client/src/components/ConversationHeader.tsx`

- [ ] **Step 1: Create ChatPage (state holder)**

```tsx
import { useState } from 'react';
import ChatLayout from '../components/ChatLayout';
import type { IConversation } from '../types/message.types';

export default function ChatPage() {
  const [activeConversation, setActiveConversation] = useState<IConversation | null>(null);

  return (
    <ChatLayout
      activeConversation={activeConversation}
      onSelectConversation={setActiveConversation}
    />
  );
}
```

- [ ] **Step 2: Create TopBar**

```tsx
import { useState } from 'react';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function TopBar() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',
  );

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  return (
    <header
      style={{
        height: '64px',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: '1.5rem',
            color: 'var(--accent)',
          }}
        >
          PulseChat
        </h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={toggleTheme} style={btnStyle}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {user?.fullName}
        </span>
        <button onClick={logout} style={btnStyle} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '8px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
```

- [ ] **Step 3: Create ChatLayout**

```tsx
import type { IConversation } from '../types/message.types';
import TopBar from './TopBar';

interface Props {
  activeConversation: IConversation | null;
  onSelectConversation: (c: IConversation) => void;
}

export default function ChatLayout({ activeConversation, onSelectConversation }: Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <aside
          style={{
            width: '340px',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--surface)',
          }}
        >
          <p style={{ padding: '20px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Conversations
          </p>
        </aside>
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--surface)',
          }}
        >
          {activeConversation ? (
            <p style={{ padding: '20px', color: 'var(--text-secondary)' }}>
              Active conversation placeholder
            </p>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
                Select a conversation to start chatting
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/ChatPage.tsx client/src/components/ChatLayout.tsx client/src/components/TopBar.tsx
git commit -m "feat(client): add chat layout with top bar and sidebar shell"
```

---

## Task 7: Conversation List

**Files:**

- Create: `client/src/components/Sidebar.tsx`
- Create: `client/src/components/ConversationList.tsx`
- Create: `client/src/components/ConversationItem.tsx`
- Create: `client/src/components/UserSearch.tsx`
- Create: `client/src/hooks/useConversations.ts`

- [ ] **Step 1: Create useConversations hook**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { IConversation } from '../types/message.types';

export function useConversations() {
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await api.get<IConversation[]>('/conversations');
      setConversations(data);
    } catch {
      // Silently fail — conversations will just be empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { conversations, loading, refetch: fetch };
}
```

- [ ] **Step 2: Create ConversationItem**

```tsx
import type { IConversation } from '../types/message.types';
import { useSocket } from '../contexts/SocketContext';

const AVATAR_COLORS = ['#C87941', '#C49B6C', '#B07D5E', '#A67C52'];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface Props {
  conversation: IConversation;
  isActive: boolean;
  onSelect: () => void;
}

export default function ConversationItem({ conversation, isActive, onSelect }: Props) {
  const { onlineUsers } = useSocket();
  const other = conversation.participants[0];
  const initials = other.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const isOnline = onlineUsers.has(other._id);
  const unread = conversation.unreadCount?.[conversation.participants[1]?._id ?? ''] ?? 0;

  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        border: 'none',
        background: isActive ? 'var(--card)' : 'transparent',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: getAvatarColor(other._id),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          {initials}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            border: '2px solid var(--surface)',
            background: isOnline ? 'var(--online)' : '#666',
            transition: 'background 0.3s',
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{other.fullName}</span>
          {conversation.lastMessage && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '2px',
          }}
        >
          <span
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '200px',
            }}
          >
            {conversation.lastMessage?.text || 'No messages yet'}
          </span>
          {unread > 0 && (
            <span
              style={{
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '10px',
                minWidth: '20px',
                textAlign: 'center',
              }}
            >
              {unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 3: Create ConversationList**

```tsx
import type { IConversation } from '../types/message.types';
import ConversationItem from './ConversationItem';

interface Props {
  conversations: IConversation[];
  activeId: string | null;
  onSelect: (c: IConversation) => void;
  loading: boolean;
}

export default function ConversationList({ conversations, activeId, onSelect, loading }: Props) {
  if (loading) {
    return (
      <p style={{ padding: '20px', color: 'var(--text-secondary)', textAlign: 'center' }}>
        Loading...
      </p>
    );
  }

  if (conversations.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>No conversations yet.</p>
        <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
          Search for someone to start chatting.
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {conversations.map((c) => (
        <ConversationItem
          key={c._id}
          conversation={c}
          isActive={c._id === activeId}
          onSelect={() => onSelect(c)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create UserSearch**

```tsx
import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { api } from '../services/api';
import type { IUser } from '../types/auth.types';
import type { IConversation } from '../types/message.types';

interface Props {
  onSelectUser: (conversation: IConversation) => void;
}

export default function UserSearch({ onSelectUser }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IUser[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    api
      .get<IUser[]>('/messages/contacts')
      .then(setResults)
      .catch(() => {});
  }, [open]);

  async function handleSelectUser(userId: string) {
    // Navigate to conversation or trigger creation
    // For now, emit send_message or just select
    setOpen(false);
    setQuery('');
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          border: 'none',
          background: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          width: '100%',
          fontSize: '0.875rem',
        }}
      >
        <Search size={16} />
        Search users...
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '80px',
          }}
        >
          <div
            style={{
              background: 'var(--card)',
              borderRadius: '12px',
              padding: '16px',
              width: '400px',
              maxWidth: '90vw',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}
            >
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem',
                }}
              />
              <button onClick={() => setOpen(false)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {results
                .filter((u) => u.fullName.toLowerCase().includes(query.toLowerCase()))
                .map((u) => (
                  <button
                    key={u._id}
                    onClick={() => handleSelectUser(u._id)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      border: 'none',
                      background: 'none',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    >
                      {u.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <span>{u.fullName}</span>
                  </button>
                ))}
            </div>
          </div>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: -1 }} />
        </div>
      )}
    </>
  );
}

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '8px',
  display: 'flex',
};
```

- [ ] **Step 5: Update Sidebar to wire everything**

```tsx
import UserSearch from './UserSearch';
import ConversationList from './ConversationList';
import { useConversations } from '../hooks/useConversations';
import type { IConversation } from '../types/message.types';

interface Props {
  activeId: string | null;
  onSelectConversation: (c: IConversation) => void;
}

export default function Sidebar({ activeId, onSelectConversation }: Props) {
  const { conversations, loading } = useConversations();

  return (
    <aside
      style={{
        width: '340px',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
      }}
    >
      <UserSearch onSelectUser={() => {}} />
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={onSelectConversation}
        loading={loading}
      />
    </aside>
  );
}
```

- [ ] **Step 6: Update ChatLayout to use Sidebar**

Replace the `<aside>` placeholder with `<Sidebar>`.

- [ ] **Step 7: Commit**

```bash
git add client/src/hooks/useConversations.ts client/src/components/Sidebar.tsx client/src/components/ConversationList.tsx client/src/components/ConversationItem.tsx client/src/components/UserSearch.tsx
git commit -m "feat(client): add conversation list, sidebar, and user search"
```

---

## Task 8: Message Window & Bubbles

**Files:**

- Create: `client/src/components/MessageWindow.tsx`
- Create: `client/src/components/MessageBubble.tsx`
- Create: `client/src/hooks/useMessages.ts`

- [ ] **Step 1: Create useMessages hook**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { IMessage } from '../types/message.types';

export function useMessages(userId: string | null) {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [before, setBefore] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const endpoint = before ? `/messages/${userId}?before=${before}` : `/messages/${userId}`;
      const data = await api.get<IMessage[]>(endpoint);
      if (data.length < 50) setHasMore(false);
      setMessages((prev) => [...data, ...prev]);
      if (data.length > 0) setBefore(data[0]?._id ?? null);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [userId, before]);

  useEffect(() => {
    setMessages([]);
    setBefore(null);
    setHasMore(true);
    if (userId) fetch();
  }, [userId]);

  return {
    messages,
    loading,
    hasMore,
    loadMore: fetch,
    addMessage: (m: IMessage) => setMessages((prev) => [...prev, m]),
  };
}
```

- [ ] **Step 2: Create MessageBubble**

```tsx
import type { IMessage } from '../types/message.types';

const AVATAR_COLORS = ['#C87941', '#C49B6C', '#B07D5E', '#A67C52'];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface Props {
  message: IMessage;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: Props) {
  const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId._id;
  const senderName = typeof message.senderId === 'object' ? message.senderId.fullName : '';
  const initials = senderName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        marginBottom: '4px',
        animation: 'messageIn 200ms ease-out',
      }}
    >
      {!isOwn && (
        <div style={{ flexShrink: 0, alignSelf: 'flex-end', marginBottom: '4px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: getAvatarColor(senderId),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.625rem',
            }}
          >
            {initials}
          </div>
        </div>
      )}
      <div
        style={{
          maxWidth: '70%',
          padding: '10px 14px',
          borderRadius: '12px',
          background: isOwn ? 'var(--bubble-sent)' : 'var(--card)',
          color: 'var(--text-primary)',
        }}
      >
        {message.text && <p style={{ fontSize: '0.9375rem', lineHeight: 1.4 }}>{message.text}</p>}
        {message.image && (
          <img
            src={message.image}
            alt="Shared image"
            style={{
              maxWidth: '100%',
              borderRadius: '8px',
              marginTop: '4px',
              display: 'block',
            }}
          />
        )}
        <p
          style={{
            fontSize: '0.6875rem',
            marginTop: '4px',
            color: isOwn ? 'var(--text-secondary)' : 'var(--accent)',
            textAlign: 'right',
          }}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
```

Add the `messageIn` keyframe to `index.css`:

```css
@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 3: Create MessageWindow**

```tsx
import { useEffect, useRef } from 'react';
import type { IMessage } from '../types/message.types';
import MessageBubble from './MessageBubble';
import type { IUser } from '../types/auth.types';

interface Props {
  messages: IMessage[];
  currentUser: IUser | null;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function MessageWindow({
  messages,
  currentUser,
  loading,
  hasMore,
  onLoadMore,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {hasMore && !loading && (
        <button
          onClick={onLoadMore}
          style={{
            alignSelf: 'center',
            padding: '8px 16px',
            marginBottom: '12px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: 'var(--card)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.8125rem',
          }}
        >
          Load older messages
        </button>
      )}
      {loading && (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
          Loading...
        </p>
      )}
      {messages.length === 0 && !loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Say hello! Start the conversation.</p>
        </div>
      )}
      {messages.map((msg) => (
        <MessageBubble
          key={msg._id}
          message={msg}
          isOwn={
            typeof msg.senderId === 'string'
              ? msg.senderId === currentUser?._id
              : msg.senderId._id === currentUser?._id
          }
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/MessageWindow.tsx client/src/components/MessageBubble.tsx client/src/hooks/useMessages.ts
git commit -m "feat(client): add message window with bubbles and pagination"
```

---

## Task 9: Message Input & Sending

**Files:**

- Create: `client/src/components/MessageInput.tsx`
- Create: `client/src/components/ConversationHeader.tsx`
- Modify: `client/src/pages/ChatPage.tsx` (wire socket send)

- [ ] **Step 1: Create MessageInput**

```tsx
import { useState, useRef } from 'react';
import { Send, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  onSend: (text?: string, image?: string) => void;
}

export default function MessageInput({ onSend }: Props) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSend() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }

  async function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await handleSend();
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { url } = await api.upload<{ url: string }>('/messages/upload', formData);
      onSend(undefined, url);
    } catch {
      // Error state — inline message
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div
      style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
      }}
    >
      <button onClick={() => fileRef.current?.click()} style={iconBtnStyle} disabled={uploading}>
        <ImageIcon size={20} />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: '10px',
          border: '1px solid var(--border)',
          background: 'var(--card)',
          color: 'var(--text-primary)',
          fontSize: '0.9375rem',
          resize: 'none',
          outline: 'none',
          fontFamily: 'inherit',
          maxHeight: '120px',
        }}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || uploading}
        style={{
          ...iconBtnStyle,
          color: text.trim() ? 'var(--accent)' : 'var(--text-secondary)',
          transition: 'color 0.2s',
        }}
      >
        <Send size={20} />
      </button>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '8px',
  display: 'flex',
  borderRadius: '8px',
};
```

- [ ] **Step 2: Create ConversationHeader**

```tsx
import { useSocket } from '../contexts/SocketContext';
import type { IConversation } from '../types/message.types';

interface Props {
  conversation: IConversation;
  onBack: () => void;
}

export default function ConversationHeader({ conversation, onBack }: Props) {
  const { onlineUsers } = useSocket();
  const other = conversation.participants[0];
  const isOnline = onlineUsers.has(other._id);

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <button
        onClick={onBack}
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '1.25rem',
        }}
      >
        ←
      </button>
      <div>
        <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{other.fullName}</p>
        <p
          style={{
            fontSize: '0.75rem',
            color: isOnline ? 'var(--online)' : 'var(--text-secondary)',
          }}
        >
          {isOnline ? 'Online' : 'Offline'}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire sending in ChatPage**

Update `ChatPage.tsx` to pass the socket `send_message` emit and wire `MessageWindow` + `MessageInput` + `ConversationHeader`.

```tsx
import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useMessages } from '../hooks/useMessages';
import ChatLayout from '../components/ChatLayout';
import ConversationHeader from '../components/ConversationHeader';
import MessageWindow from '../components/MessageWindow';
import MessageInput from '../components/MessageInput';
import type { IConversation } from '../types/message.types';

export default function ChatPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeConversation, setActiveConversation] = useState<IConversation | null>(null);

  const otherUserId = activeConversation
    ? (activeConversation.participants.find((p) => p._id !== user?._id)?._id ?? null)
    : null;

  const { messages, loading, hasMore, loadMore, addMessage } = useMessages(otherUserId);

  const handleSend = useCallback(
    (text?: string, image?: string) => {
      if (!otherUserId || !socket) return;
      socket.emit('send_message', { receiverId: otherUserId, text, image }, (res) => {
        if (res.success && res.message) {
          addMessage(res.message);
        }
      });
    },
    [otherUserId, socket, addMessage],
  );

  return (
    <ChatLayout
      activeConversation={activeConversation}
      onSelectConversation={setActiveConversation}
    >
      {activeConversation ? (
        <>
          <ConversationHeader
            conversation={activeConversation}
            onBack={() => setActiveConversation(null)}
          />
          <MessageWindow
            messages={messages}
            currentUser={user}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
          />
          <MessageInput onSend={handleSend} />
        </>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Select a conversation to start chatting
          </p>
        </div>
      )}
    </ChatLayout>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/MessageInput.tsx client/src/components/ConversationHeader.tsx client/src/pages/ChatPage.tsx
git commit -m "feat(client): add message input, sending, and conversation header"
```

---

## Task 10: Typing Indicator & Real-time Updates

**Files:**

- Create: `client/src/hooks/useTypingIndicator.ts`
- Create: `client/src/components/TypingIndicator.tsx`
- Modify: `client/src/pages/ChatPage.tsx` (wire typing + new_message listener)

- [ ] **Step 1: Create useTypingIndicator hook**

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';

export function useTypingIndicator(receiverId: string | null) {
  const { socket } = useSocket();
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmitRef = useRef(0);

  useEffect(() => {
    if (!socket) return;

    const handleStart = ({ userId }: { userId: string }) => {
      if (userId === receiverId) setIsPartnerTyping(true);
    };
    const handleStop = ({ userId }: { userId: string }) => {
      if (userId === receiverId) setIsPartnerTyping(false);
    };

    socket.on('typing_start', handleStart);
    socket.on('typing_stop', handleStop);

    return () => {
      socket.off('typing_start', handleStart);
      socket.off('typing_stop', handleStop);
    };
  }, [socket, receiverId]);

  const emitTyping = useCallback(() => {
    if (!socket || !receiverId) return;
    const now = Date.now();
    if (now - lastEmitRef.current < 3000) return;
    lastEmitRef.current = now;
    socket.emit('typing_start', { receiverId });

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('typing_stop', { receiverId });
    }, 2000);
  }, [socket, receiverId]);

  return { isPartnerTyping, emitTyping };
}
```

- [ ] **Step 2: Create TypingIndicator**

```tsx
interface Props {
  name: string;
}

export default function TypingIndicator({ name }: Props) {
  return (
    <div
      style={{
        padding: '4px 16px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--accent)',
        fontSize: '0.8125rem',
        animation: 'fadeIn 150ms ease-out',
      }}
    >
      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
        <span style={dotStyle(0)} />
        <span style={dotStyle(0.15)} />
        <span style={dotStyle(0.3)} />
      </div>
      {name} is typing...
    </div>
  );
}

function dotStyle(delay: number): React.CSSProperties {
  return {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--accent)',
    opacity: 0.6,
    animation: `bounce 1s ease-in-out ${delay}s infinite`,
  };
}

// Add to index.css:
// @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-4px); } }
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
```

- [ ] **Step 3: Wire real-time message receiving in ChatPage**

Add a `useEffect` in `ChatPage` that listens for `new_message` on the socket and appends to the active conversation's message list, or bumps the conversation list for non-active conversations.

```typescript
useEffect(() => {
  if (!socket) return;

  const handleNewMessage = (message: import('../types/message.types').IMessage) => {
    const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId._id;
    if (senderId === otherUserId) {
      addMessage(message);
    }
  };

  socket.on('new_message', handleNewMessage);
  return () => {
    socket.off('new_message', handleNewMessage);
  };
}, [socket, otherUserId, addMessage]);
```

- [ ] **Step 4: Commit**

```bash
git add client/src/hooks/useTypingIndicator.ts client/src/components/TypingIndicator.tsx
git commit -m "feat(client): add typing indicator and real-time message receiving"
```

---

## Task 11: Polish — Empty States, Responsive, Mark Read

**Files:**

- Modify: `client/src/components/ChatLayout.tsx` (responsive sidebar)
- Modify: `client/src/components/ConversationHeader.tsx` (show back button on mobile)
- Modify: `client/src/pages/ChatPage.tsx` (mark_read on conversation switch)

- [ ] **Step 1: Add mark_read on conversation switch**

In `ChatPage.tsx`, when `activeConversation` changes, emit `mark_read`:

```typescript
useEffect(() => {
  if (!activeConversation?._id || !socket) return;
  socket.emit('mark_read', { conversationId: activeConversation._id }, () => {});
}, [activeConversation?._id, socket]);
```

- [ ] **Step 2: Add responsive sidebar (mobile overlay)**

Update `ChatLayout.tsx` to show/hide sidebar based on a media query and the active conversation state:

```tsx
// Add mobile styles: sidebar slides over content, back button shows
// Use CSS media query or window.matchMedia
// On screens < 768px, sidebar becomes an overlay when no conversation is active
```

- [ ] **Step 3: Verify full build**

```bash
cd /home/ayomide/sandbox/PulseChat/client
npx tsc --noEmit
```

Expected: Zero errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/
git commit -m "feat(client): add responsive sidebar, mark_read, and final polish"
```
