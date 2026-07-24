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
    <div className="px-4 py-3 border-t border-border bg-surface flex items-end gap-2">
      <button
        onClick={() => fileRef.current?.click()}
        className="bg-transparent border-none text-text-secondary cursor-pointer p-2 flex rounded-lg hover:text-accent transition-colors duration-200"
        disabled={uploading}
      >
        <ImageIcon size={20} />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
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
        className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-card text-text-primary text-[0.9375rem] resize-none outline-none font-sans max-h-30"
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || uploading}
        className={`bg-transparent border-none cursor-pointer p-2 flex rounded-lg transition-colors duration-200 ${
          text.trim() ? 'text-accent' : 'text-text-secondary'
        }`}
      >
        <Send size={20} />
      </button>
    </div>
  );
}
