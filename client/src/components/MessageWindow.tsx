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
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {hasMore && !loading && (
        <button
          onClick={onLoadMore}
          style={{
            alignSelf: 'center',
            padding: '8px 16px',
            marginBottom: '12px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: 'var(--card)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.8125rem',
          }}
        >
          Load older messages
        </button>
      )}
      {loading && (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
          Loading...
        </p>
      )}
      {messages.length === 0 && !loading && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p style={{ color: 'var(--text-secondary)' }}>Say hello! Start the conversation.</p>
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
