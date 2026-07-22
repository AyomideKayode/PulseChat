import { useState } from 'react';
import ChatLayout from '../components/ChatLayout';
import type { IConversation } from '../types/message.types';

export default function ChatPage() {
  const [activeConversation, setActiveConversation] = useState<IConversation | null>(null);

  return (
    <ChatLayout
      activeConversation={activeConversation}
      onSelectConversation={setActiveConversation}
    />
  );
}
