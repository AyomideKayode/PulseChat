import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useMobile } from '../contexts/MobileContext';
import ProfileModal from './ProfileModal';
import type { IConversation } from '../types/message.types';

interface Props {
  conversation: IConversation;
  onBack: () => void;
}

export default function ConversationHeader({ conversation, onBack }: Props) {
  const [showProfile, setShowProfile] = useState(false);
  const { onlineUsers } = useSocket();
  const { user } = useAuth();
  const { isMobile } = useMobile();

  const other = conversation.participants.find((p) => p._id !== user?._id) ?? conversation.participants[0];
  const isOnline = other ? onlineUsers.has(other._id) : false;

  const { openSidebar } = useMobile();

  function handleBack() {
    if (isMobile) {
      openSidebar();
    } else {
      onBack();
    }
  }

  return (
    <>
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        {isMobile && (
          <button
            onClick={handleBack}
            className="bg-transparent border-none text-text-secondary cursor-pointer p-1 flex"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <button
          onClick={() => setShowProfile(true)}
          className="bg-transparent border-none text-left cursor-pointer flex-1"
        >
          <p className="font-semibold text-[0.9375rem] text-text-primary">
            {other?.fullName ?? 'Unknown'}
          </p>
          <p className={`text-xs ${isOnline ? 'text-online' : 'text-text-secondary'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </button>
      </div>
      {showProfile && other && (
        <ProfileModal
          user={other}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
}
