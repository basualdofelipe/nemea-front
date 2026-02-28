'use client';

import type { ReactElement } from 'react';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';

function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): boolean {
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function Home(): ReactElement {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  function toggleTheme(): void {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <div className='flex min-h-screen flex-col items-center justify-center gap-8'>
      <h1 className='engraving-title text-primary text-6xl tracking-widest'>
        NEMEA
      </h1>
      <p className='text-muted-foreground font-sans text-lg'>
        Gestion y pricing para marroquineria
      </p>
      {mounted && (
        <Button variant='outline' onClick={toggleTheme}>
          {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        </Button>
      )}
    </div>
  );
}
