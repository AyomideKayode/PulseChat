import type { IConversation } from '../types/message.types';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

const AVATAR_COLORS = ['#C87941', '#C49B6C', '#B07D5E', '#A67C52'];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? '#C87941';
}

interface Props {
  conversation: IConversation;
  isActive: boolean;
  onSelect: () => void;
}

export default function ConversationItem({ conversation, isActive, onSelect }: Props) {
  const { onlineUsers } = useSocket();
  const { user } = useAuth();
  const other = conversation.participants.find((p) => p._id !== user?._id) ?? conversation.participants[0];
  if (!other) return null;

  const initials = other.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const isOnline = onlineUsers.has(other._id);
  const unread = conversation.unreadCount?.[user?._id ?? ''] ?? 0;

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
