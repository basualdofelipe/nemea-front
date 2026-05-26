import type { ReactElement } from 'react';
import { signIn } from '@/auth';
import { Button } from '@/components/ui/button';

const DEMO_EMAIL = 'demo@nemea.app';

export function DemoLoginButton(): ReactElement {
  async function handleDemoLogin(): Promise<void> {
    'use server';
    await signIn('credentials', { email: DEMO_EMAIL, redirectTo: '/' });
  }

  return (
    <form action={handleDemoLogin}>
      <Button
        type='submit'
        variant='outline'
        size='lg'
        className='w-full gap-3'
      >
        Entrar como demo
      </Button>
    </form>
  );
}
