'use client';

import type { ReactElement } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: ErrorProps): ReactElement {
  return (
    <div className='flex min-h-[400px] flex-col items-center justify-center gap-4 p-6'>
      <p className='text-lg font-semibold'>Algo salió mal</p>
      <p className='text-muted-foreground text-sm'>
        {error.digest
          ? `Código: ${error.digest}`
          : 'Ocurrió un error inesperado.'}
      </p>
      <Button variant='outline' onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
