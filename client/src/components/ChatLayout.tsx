import { useState, useEffect, type ReactNode } from 'react';
import type { IConversation } from '../types/message.types';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import { MobileProvider } from '../contexts/MobileContext';

interface Props {
  activeConversation: IConversation | null;
  onSelectConversation: (c: IConversation) => void;
  children?: ReactNode;
}

export default function ChatLayout({ activeConversation, onSelectConversation, children }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isMobile) setMobileSidebarOpen(false);
  }, [isMobile]);

  function handleSelectConversation(c: IConversation) {
    onSelectConversation(c);
    if (isMobile) setMobileSidebarOpen(false);
  }

  function handleBack() {
    setMobileSidebarOpen(true);
  }

  return (
    <div className="h-full flex flex-col">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        {!isMobile && (
          <Sidebar
            activeId={activeConversation?._id ?? null}
            onSelectConversation={handleSelectConversation}
          />
        )}

        {/* Mobile sidebar overlay */}
        {isMobile && mobileSidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="fixed left-0 top-16 bottom-0 w-full z-50">
              <Sidebar
                activeId={activeConversation?._id ?? null}
                onSelectConversation={handleSelectConversation}
              />
            </div>
          </>
        )}

        {/* Main content area */}
        <main className={`flex-1 flex flex-col bg-surface ${isMobile && mobileSidebarOpen ? 'hidden' : ''}`}>
          {activeConversation ? (
            <MobileProvider isMobile={isMobile} openSidebar={() => setMobileSidebarOpen(true)}>
              {children}
            </MobileProvider>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col gap-3">
              <p className="text-text-secondary text-lg">
                Select a conversation to start chatting
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
