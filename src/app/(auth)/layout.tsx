import type { ReactElement, ReactNode } from 'react';

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      {children}
    </div>
  );
}
