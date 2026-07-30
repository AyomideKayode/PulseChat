import { useState } from 'react';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SoundToggle from './SoundToggle';

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
    <header className="h-16 px-5 flex items-center justify-between border-b border-border bg-surface">
      <div className="flex items-center gap-2">
        <h1 className="font-serif text-2xl text-accent">PulseChat</h1>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="p-2 rounded-lg border-none text-text-secondary cursor-pointer flex items-center justify-center hover:text-accent transition-colors duration-200">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <SoundToggle />
        <span className="text-sm text-text-secondary">{user?.fullName}</span>
        <button onClick={logout} className="p-2 rounded-lg border-none text-text-secondary cursor-pointer flex items-center justify-center hover:text-accent transition-colors duration-200" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
