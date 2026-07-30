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
    api
      .get<IUser[]>('/messages/contacts')
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
