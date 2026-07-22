import type { IConversation } from '../types/message.types';
import ConversationItem from './ConversationItem';

interface Props {
  conversations: IConversation[];
  activeId: string | null;
  onSelect: (c: IConversation) => void;
  loading: boolean;
}

export default function ConversationList({ conversations, activeId, onSelect, loading }: Props) {
  if (loading) {
    return (
      <p style={{ padding: '20px', color: 'var(--text-secondary)', textAlign: 'center' }}>
        Loading...
      </p>
    );
  }

  if (conversations.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>No conversations yet.</p>
        <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
          Search for someone to start chatting.
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {conversations.map((c) => (
        <ConversationItem
          key={c._id}
          conversation={c}
          isActive={c._id === activeId}
          onSelect={() => onSelect(c)}
        />
      ))}
    </div>
  );
}
