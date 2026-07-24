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
      className={`w-full px-4 py-3 flex items-center gap-3 border-none text-text-primary cursor-pointer text-left ${
        isActive ? 'bg-card' : 'bg-transparent'
      }`}
    >
      <div className="relative shrink-0">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm"
          style={{ background: getAvatarColor(other._id) }}
        >
          {initials}
        </div>
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface transition-colors duration-300 ${
            isOnline ? 'bg-online' : 'bg-[#666]'
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="font-medium text-[0.9375rem]">{other.fullName}</span>
          {conversation.lastMessage && (
            <span className="text-xs text-text-secondary">
              {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <span className="text-sm text-text-secondary truncate max-w-50">
            {conversation.lastMessage?.text || 'No messages yet'}
          </span>
          {unread > 0 && (
            <span className="bg-accent text-white text-xs font-semibold px-2 py-0.5 rounded-full min-w-5 text-center">
              {unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
