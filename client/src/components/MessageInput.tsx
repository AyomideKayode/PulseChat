import { useState, useRef } from 'react';
import { Send, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  onSend: (text?: string, image?: string) => void;
  onTyping?: () => void;
}

export default function MessageInput({ onSend, onTyping }: Props) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSend() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }

  async function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await handleSend();
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { url } = await api.upload<{ url: string }>('/messages/upload', formData);
      onSend(undefined, url);
    } catch {
      // Error state
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div
      style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
      }}
    >
      <button onClick={() => fileRef.current?.click()} style={iconBtnStyle} disabled={uploading}>
        <ImageIcon size={20} />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onTyping?.();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: '10px',
          border: '1px solid var(--border)',
          background: 'var(--card)',
          color: 'var(--text-primary)',
          fontSize: '0.9375rem',
          resize: 'none',
          outline: 'none',
          fontFamily: 'inherit',
          maxHeight: '120px',
        }}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || uploading}
        style={{
          ...iconBtnStyle,
          color: text.trim() ? 'var(--accent)' : 'var(--text-secondary)',
          transition: 'color 0.2s',
        }}
      >
        <Send size={20} />
      </button>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '8px',
  display: 'flex',
  borderRadius: '8px',
};
