import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import type { IConversation } from '../types/message.types';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  conversation: IConversation;
  onBack: () => void;
}

export default function ConversationHeader({ conversation, onBack }: Props) {
  const { onlineUsers } = useSocket();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const other = conversation.participants.find((p) => p._id !== user?._id) ?? conversation.participants[0];
  const isOnline = other ? onlineUsers.has(other._id) : false;

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
      {isMobile && (
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
          }}
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <div>
        <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{other?.fullName ?? 'Unknown'}</p>
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
