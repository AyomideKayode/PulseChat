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
    api.get<IUser[]>('/messages/contacts').then(setResults).catch(() => {});
  }, [open]);

  async function handleSelectUser(userId: string) {
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}
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
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: -1 }}
          />
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
