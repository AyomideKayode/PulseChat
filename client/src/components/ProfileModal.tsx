import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import type { IUser } from '../types/auth.types';

const AVATAR_COLORS = ['#C87941', '#C49B6C', '#B07D5E', '#A67C52'];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? '#C87941';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

interface Props {
  user: IUser & { createdAt?: string };
  onClose: () => void;
}

export default function ProfileModal({ user, onClose }: Props) {
  const { onlineUsers } = useSocket();
  const overlayRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isOnline = onlineUsers.has(user._id);
  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={user.fullName}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
    >
      <div className="bg-surface rounded-xl w-full max-w-sm border border-border shadow-xl overflow-hidden animate-scale-in">
        <div className="relative flex flex-col items-center pt-10 pb-5 px-6">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-transparent border-none text-text-secondary cursor-pointer p-1 hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
          <div
            style={{ background: getAvatarColor(user._id) }}
            className="h-16 w-16 rounded-full flex items-center justify-center text-white font-semibold text-lg"
          >
            {initials}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <p className="font-semibold text-[1.0625rem]">{user.fullName}</p>
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-online' : 'bg-text-secondary'}`}
            />
          </div>
          <p className="text-text-secondary text-xs mt-0.5">
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
        <div className="border-t border-border px-6 py-4 flex flex-col gap-3">
          <div>
            <p className="text-text-secondary text-[0.6875rem] uppercase tracking-widest font-semibold">
              Email
            </p>
            <p className="text-text-primary text-sm">{user.email}</p>
          </div>
          {user.createdAt && (
            <div>
              <p className="text-text-secondary text-[0.6875rem] uppercase tracking-widest font-semibold">
                Joined
              </p>
              <p className="text-text-primary text-sm">{formatDate(user.createdAt)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
