import type { IMessage } from '../types/message.types';

const AVATAR_COLORS = ['#C87941', '#C49B6C', '#B07D5E', '#A67C52'];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? '#C87941';
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
