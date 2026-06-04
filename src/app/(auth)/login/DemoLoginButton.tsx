'use client';

import { useState, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DEMO_EMAIL } from '@/constants/branding';

export function DemoLoginButton(): ReactElement {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleDemoLogin(): Promise<void> {
    setIsPending(true);
    // Client-side signIn (next-auth/react) updates the SessionProvider session
    // directly, so the sidebar (client usePermissions -> useSession) populates
    // after one click without a hard reload. We avoid the auto-redirect and
    // navigate ourselves once the session is in place.
    const result = await signIn('credentials', {
      email: DEMO_EMAIL,
      redirect: false,
    });

    if (result?.error !== undefined && result.error !== null) {
      setIsPending(false);
      toast.error(
        'No se pudo iniciar el login demo. Verificá la configuración.',
      );
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <Button
      type='button'
      variant='outline'
      size='lg'
      className='w-full gap-3'
      disabled={isPending}
      onClick={() => {
        void handleDemoLogin();
      }}
    >
      Entrar como demo
    </Button>
  );
}
