'use client';

import type { ReactElement } from 'react';
import { signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function handleSignOut(): void {
  void signOut({ callbackUrl: '/login' });
}

export default function AccesoDenegadoPage(): ReactElement {
  return (
    <Card className='w-full max-w-sm'>
      <CardHeader className='items-center space-y-2 text-center'>
        <h1 className='engraving-title text-primary text-3xl tracking-widest'>
          NEMEA
        </h1>
        <h2 className='text-foreground text-lg font-semibold'>Sin acceso</h2>
      </CardHeader>
      <CardContent className='space-y-4 text-center'>
        <p className='text-muted-foreground text-sm'>
          Tu cuenta no tiene acceso a Nemea. Contacta al administrador.
        </p>
        <Button
          variant='outline'
          size='lg'
          className='w-full'
          onClick={handleSignOut}
        >
          Cerrar sesion
        </Button>
      </CardContent>
    </Card>
  );
}
