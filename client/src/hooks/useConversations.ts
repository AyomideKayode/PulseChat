import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { IConversation } from '../types/message.types';
import type { TypedSocket } from '../services/socket';

export function useConversations(socket?: TypedSocket | null) {
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await api.get<IConversation[]>('/conversations');
      setConversations(data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => fetch();
    socket.on('new_message', handler);
    return () => {
      socket.off('new_message', handler);
    };
  }, [socket, fetch]);

  return { conversations, loading, refetch: fetch };
}
