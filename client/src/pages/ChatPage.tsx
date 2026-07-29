import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useMessages } from '../hooks/useMessages';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import ChatLayout from '../components/ChatLayout';
import ConversationHeader from '../components/ConversationHeader';
import MessageWindow from '../components/MessageWindow';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';
import type { IConversation, IMessage } from '../types/message.types';

export default function ChatPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeConversation, setActiveConversation] = useState<IConversation | null>(null);
  const lastActiveRef = useRef<IConversation | null>(null);

  const handleSetConversation = useCallback((c: IConversation | null) => {
    lastActiveRef.current = c;
    setActiveConversation(c);
  }, []);

  const handleBack = useCallback(() => {
    lastActiveRef.current = null;
    setActiveConversation(null);
  }, []);

  const otherUserId = activeConversation
    ? (activeConversation.participants.find((p) => p._id !== user?._id)?._id ?? null)
    : null;

  useEffect(() => {
    if (!activeConversation && lastActiveRef.current) {
      setActiveConversation(lastActiveRef.current);
    }
  }, [activeConversation]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeConversation) {
        handleBack();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeConversation, handleBack]);

  const { messages, loading, hasMore, loadMore, addMessage } = useMessages(otherUserId);
  const { isPartnerTyping, emitTyping } = useTypingIndicator(otherUserId);

  useEffect(() => {
    if (!activeConversation?._id || !socket) return;
    socket.emit('mark_read', { conversationId: activeConversation._id }, () => {});
  }, [activeConversation?._id, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: IMessage) => {
      const senderId =
        typeof message.senderId === 'string' ? message.senderId : message.senderId._id;
      if (senderId === otherUserId) {
        addMessage(message);
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, otherUserId, addMessage]);

  const handleSend = useCallback(
    (text?: string, image?: string) => {
      if (!otherUserId || !socket) return;
      socket.emit('send_message', { receiverId: otherUserId, text, image }, (res) => {
        if (res.success && res.message) {
          addMessage(res.message);
        }
      });
    },
    [otherUserId, socket, addMessage],
  );

  const other = activeConversation
    ? activeConversation.participants.find((p) => p._id !== user?._id)
    : null;

  return (
    <ChatLayout
      activeConversation={activeConversation}
      onSelectConversation={handleSetConversation}
    >
      {activeConversation && (
        <>
          <ConversationHeader
            conversation={activeConversation}
            onBack={handleBack}
          />
          <MessageWindow
            messages={messages}
            currentUser={user}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
          />
          {isPartnerTyping && other && <TypingIndicator name={other.fullName} />}
          <MessageInput onSend={handleSend} onTyping={emitTyping} />
        </>
      )}
    </ChatLayout>
  );
}
