import type { IConversation } from '../types/message.types';
import ConversationItem from './ConversationItem';
import ConversationSkeleton from './ConversationSkeleton';

interface Props {
  conversations: IConversation[];
  activeId: string | null;
  onSelect: (c: IConversation) => void;
  loading: boolean;
}

export default function ConversationList({ conversations, activeId, onSelect, loading }: Props) {
  if (loading) {
    return <ConversationSkeleton />;
  }

  if (conversations.length === 0) {
    return (
      <div className="p-5 text-center text-text-secondary">
        <p>No conversations yet.</p>
        <p className="text-sm mt-2">Search for someone to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
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
