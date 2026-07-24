import { useEffect, useRef } from 'react';
import type { IMessage } from '../types/message.types';
import MessageBubble from './MessageBubble';
import type { IUser } from '../types/auth.types';

interface Props {
  messages: IMessage[];
  currentUser: IUser | null;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function MessageWindow({
  messages,
  currentUser,
  loading,
  hasMore,
  onLoadMore,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 flex flex-col"
    >
      {hasMore && !loading && (
        <button
          onClick={onLoadMore}
          className="self-center px-4 py-2 mb-3 border border-border rounded-lg bg-card text-text-secondary cursor-pointer text-sm"
        >
          Load older messages
        </button>
      )}
      {loading && (
        <p className="text-center text-text-secondary p-5">Loading...</p>
      )}
      {messages.length === 0 && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-secondary">Say hello! Start the conversation.</p>
        </div>
      )}
      {messages.map((msg) => (
        <MessageBubble
          key={msg._id}
          message={msg}
          isOwn={
            typeof msg.senderId === 'string'
              ? msg.senderId === currentUser?._id
              : msg.senderId._id === currentUser?._id
          }
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
