import { useState } from 'react';
import { MessageCircle, Users } from 'lucide-react';
import ConversationList from './ConversationList';
import ContactsList from './ContactsList';
import { useConversations } from '../hooks/useConversations';
import { useSocket } from '../contexts/SocketContext';
import type { IConversation } from '../types/message.types';

interface Props {
  activeId: string | null;
  onSelectConversation: (c: IConversation) => void;
}

type Tab = 'chats' | 'contacts';

export default function Sidebar({ activeId, onSelectConversation }: Props) {
  const [tab, setTab] = useState<Tab>('chats');
  const { socket } = useSocket();
  const { conversations, loading, refetch } = useConversations(socket);

  return (
    <aside className="sidebar w-85 border-r border-border flex flex-col bg-surface">
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab('chats')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 border-none text-sm font-semibold cursor-pointer transition-colors ${
            tab === 'chats'
              ? 'text-accent border-b-2 border-accent'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <MessageCircle size={16} />
          Chats
        </button>
        <button
          onClick={() => setTab('contacts')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 border-none text-sm font-semibold cursor-pointer transition-colors ${
            tab === 'contacts'
              ? 'text-accent border-b-2 border-accent'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Users size={16} />
          Contacts
        </button>
      </div>
      {tab === 'chats' ? (
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={onSelectConversation}
          loading={loading}
        />
      ) : (
        <ContactsList
          onSelectUser={(conversation) => {
            onSelectConversation(conversation);
            refetch();
            setTab('chats');
          }}
        />
      )}
    </aside>
  );
}
