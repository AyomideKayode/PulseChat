import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import type { IMessage } from '../types/message.types';

export function useMessages(userId: string | null) {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const beforeRef = useRef<string | null>(null);

  const fetchInitial = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await api.get<IMessage[]>(`/messages/${userId}`);
      if (data.length < 50) setHasMore(false);
      if (data.length > 0) beforeRef.current = data[0]?._id ?? null;
      setMessages(data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadMore = useCallback(async () => {
    if (!userId || !beforeRef.current) return;
    setLoading(true);
    try {
      const data = await api.get<IMessage[]>(`/messages/${userId}?before=${beforeRef.current}`);
      if (data.length < 50) setHasMore(false);
      if (data.length > 0) beforeRef.current = data[0]?._id ?? null;
      setMessages((prev) => [...data, ...prev]);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setMessages([]);
    beforeRef.current = null;
    setHasMore(true);
    fetchInitial();
  }, [fetchInitial]);

  return {
    messages,
    loading,
    hasMore,
    loadMore,
    addMessage: useCallback((m: IMessage) => {
      setMessages((prev) => [...prev, m]);
    }, []),
  };
}
