import { useState } from 'react';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function TopBar() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',
  );

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  return (
    <header
      style={{
        height: '64px',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: '1.5rem',
            color: 'var(--accent)',
          }}
        >
          PulseChat
        </h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={toggleTheme} style={btnStyle}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {user?.fullName}
        </span>
        <button onClick={logout} style={btnStyle} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '8px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
