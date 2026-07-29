import { useState, useCallback } from 'react';

export function useSoundToggle() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    () => localStorage.getItem('soundEnabled') !== 'false',
  );

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('soundEnabled', String(next));
      return next;
    });
  }, []);

  return { soundEnabled, toggleSound };
}
