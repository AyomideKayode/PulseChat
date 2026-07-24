import UserSearch from './UserSearch';
import ConversationList from './ConversationList';
import { useConversations } from '../hooks/useConversations';
import { useSocket } from '../contexts/SocketContext';
import type { IConversation } from '../types/message.types';

interface Props {
  activeId: string | null;
  onSelectConversation: (c: IConversation) => void;
}

export default function Sidebar({ activeId, onSelectConversation }: Props) {
  const { socket } = useSocket();
  const { conversations, loading, refetch } = useConversations(socket);

  return (
    <aside className="sidebar w-85 border-r border-border flex flex-col bg-surface">
      <UserSearch
        existingConversations={conversations}
        onSelectUser={(conversation) => {
          onSelectConversation(conversation);
          refetch();
        }}
      />
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={onSelectConversation}
        loading={loading}
      />
    </aside>
  );
}
