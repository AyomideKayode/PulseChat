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
