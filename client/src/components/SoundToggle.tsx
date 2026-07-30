import { Volume2, VolumeX } from 'lucide-react';
import { useSoundToggle } from '../hooks/useSoundToggle';

export default function SoundToggle() {
  const { soundEnabled, toggleSound } = useSoundToggle();

  return (
    <button
      onClick={toggleSound}
      className="p-2 rounded-lg border-none text-text-secondary cursor-pointer flex items-center justify-center hover:text-accent transition-colors duration-200"
      aria-label={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
      title={soundEnabled ? 'Sound on' : 'Sound off'}
    >
      {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  );
}
