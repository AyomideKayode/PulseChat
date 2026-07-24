import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { api } from '../services/api';
import type { IUser } from '../types/auth.types';
import type { IConversation } from '../types/message.types';

interface Props {
  existingConversations: IConversation[];
  onSelectUser: (conversation: IConversation) => void;
}

export default function UserSearch({ existingConversations, onSelectUser }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IUser[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    api.get<IUser[]>('/messages/contacts').then(setResults).catch(() => {});
  }, [open]);

  async function handleSelectUser(userId: string) {
    setError('');

    const existing = existingConversations.find((c) =>
      c.participants.some((p) => p._id === userId),
    );
    if (existing) {
      setOpen(false);
      setQuery('');
      onSelectUser(existing);
      return;
    }

    try {
      const conversation = await api.post<IConversation>(`/conversations/${userId}`);
      setOpen(false);
      setQuery('');
      onSelectUser(conversation);
    } catch {
      setError('Failed to start conversation');
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 border-none bg-transparent text-text-secondary cursor-pointer w-full text-sm"
      >
        <Search size={16} />
        Search users...
      </button>

      {open && (
        <div className="fixed inset-0 z-100 flex items-start justify-center pt-20">
          <div className="bg-card rounded-xl p-4 w-100 max-w-[90vw] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-2 mb-3">
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name..."
                className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-surface text-text-primary text-[0.9375rem]"
              />
              <button
                onClick={() => setOpen(false)}
                className="bg-transparent border-none text-text-secondary cursor-pointer p-2 flex"
              >
                <X size={18} />
              </button>
            </div>
            {error && (
              <p className="text-[#E74C3C] text-sm mb-2">{error}</p>
            )}
            <div className="max-h-75 overflow-y-auto">
              {results
                .filter((u) => u.fullName.toLowerCase().includes(query.toLowerCase()))
                .map((u) => (
                  <button
                    key={u._id}
                    onClick={() => handleSelectUser(u._id)}
                    className="w-full px-3 py-2.5 flex items-center gap-3 border-none bg-transparent text-text-primary cursor-pointer rounded-lg text-left"
                  >
                    <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-white font-semibold text-xs shrink-0">
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
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[-1]"
          />
        </div>
      )}
    </>
  );
}
