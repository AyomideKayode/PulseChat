import UserSearch from './UserSearch';
import ConversationList from './ConversationList';
import { useConversations } from '../hooks/useConversations';
import type { IConversation } from '../types/message.types';

interface Props {
  activeId: string | null;
  onSelectConversation: (c: IConversation) => void;
}

export default function Sidebar({ activeId, onSelectConversation }: Props) {
  const { conversations, loading } = useConversations();

  return (
    <aside
      className="sidebar"
      style={{
        width: '340px',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
      }}
    >
      <UserSearch onSelectUser={() => {}} />
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={onSelectConversation}
        loading={loading}
      />
    </aside>
  );
}
