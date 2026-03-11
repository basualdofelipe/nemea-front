import type { ReactElement, ReactNode } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className='flex-1 p-4 sm:p-6'>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
