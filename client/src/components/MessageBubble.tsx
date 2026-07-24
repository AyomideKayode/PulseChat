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
    <div className={`flex gap-2 mb-1 animate-message-in ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && (
        <div className="shrink-0 self-end mb-1">
          <div
            style={{ background: getAvatarColor(senderId) }}
            className="h-7 w-7 rounded-full flex items-center justify-center text-white font-semibold text-[0.625rem]"
          >
            {initials}
          </div>
        </div>
      )}
      <div
        className={`max-w-[70%] px-3.5 py-2.5 rounded-xl ${isOwn ? 'bg-bubble-sent' : 'bg-card'} text-text-primary`}
      >
        {message.text && <p className="text-[0.9375rem] leading-[1.4]">{message.text}</p>}
        {message.image && (
          <img
            src={message.image}
            alt="Shared image"
            className="max-w-full rounded-lg mt-1 block"
          />
        )}
        <p
          className={`text-[0.6875rem] mt-1 text-right ${isOwn ? 'text-text-secondary' : 'text-accent'}`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
