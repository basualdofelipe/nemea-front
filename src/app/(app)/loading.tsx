import type { ReactElement } from 'react';
import { Loader2 } from 'lucide-react';

export default function AppLoading(): ReactElement {
  return (
    <div className='flex min-h-[400px] items-center justify-center'>
      <Loader2 className='text-primary size-8 animate-spin' />
    </div>
  );
}
