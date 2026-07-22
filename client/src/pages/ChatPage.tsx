import { useState, useCallback, useEffect } from 'react';
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

  const otherUserId = activeConversation
    ? (activeConversation.participants.find((p) => p._id !== user?._id)?._id ?? null)
    : null;

  const { messages, loading, hasMore, loadMore, addMessage } = useMessages(otherUserId);
  const { isPartnerTyping, emitTyping } = useTypingIndicator(otherUserId);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: IMessage) => {
      const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId._id;
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
      onSelectConversation={setActiveConversation}
    >
      {activeConversation && (
        <>
          <ConversationHeader
            conversation={activeConversation}
            onBack={() => setActiveConversation(null)}
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
