import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { IConversation } from '../types/message.types';

export function useConversations() {
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

  return { conversations, loading, refetch: fetch };
}
