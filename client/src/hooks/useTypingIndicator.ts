import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';

export function useTypingIndicator(receiverId: string | null) {
  const { socket } = useSocket();
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmitRef = useRef(0);

  useEffect(() => {
    if (!socket) return;

    const handleStart = ({ userId }: { userId: string }) => {
      if (userId === receiverId) setIsPartnerTyping(true);
    };
    const handleStop = ({ userId }: { userId: string }) => {
      if (userId === receiverId) setIsPartnerTyping(false);
    };

    socket.on('typing_start', handleStart);
    socket.on('typing_stop', handleStop);

    return () => {
      socket.off('typing_start', handleStart);
      socket.off('typing_stop', handleStop);
    };
  }, [socket, receiverId]);

  const emitTyping = useCallback(() => {
    if (!socket || !receiverId) return;
    const now = Date.now();
    if (now - lastEmitRef.current < 3000) return;
    lastEmitRef.current = now;
    socket.emit('typing_start', { receiverId });

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('typing_stop', { receiverId });
    }, 2000);
  }, [socket, receiverId]);

  return { isPartnerTyping, emitTyping };
}
