import type { IConversation } from '../types/message.types';
import TopBar from './TopBar';

interface Props {
  activeConversation: IConversation | null;
  onSelectConversation: (c: IConversation) => void;
}

export default function ChatLayout({ activeConversation, onSelectConversation }: Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <aside
          style={{
            width: '340px',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--surface)',
          }}
        >
          <p style={{ padding: '20px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Conversations
          </p>
        </aside>
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--surface)',
          }}
        >
          {activeConversation ? (
            <p style={{ padding: '20px', color: 'var(--text-secondary)' }}>
              Active conversation placeholder
            </p>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
                Select a conversation to start chatting
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
