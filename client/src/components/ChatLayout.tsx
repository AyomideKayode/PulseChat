import type { ReactNode } from 'react';
import type { IConversation } from '../types/message.types';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

interface Props {
  activeConversation: IConversation | null;
  onSelectConversation: (c: IConversation) => void;
  children?: ReactNode;
}

export default function ChatLayout({ activeConversation, onSelectConversation, children }: Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar
          activeId={activeConversation?._id ?? null}
          onSelectConversation={onSelectConversation}
        />
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--surface)',
          }}
        >
          {activeConversation ? (
            children
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
