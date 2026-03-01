'use client';

import type { ReactElement } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name.charAt(0).toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return '?';
}

function handleSignOut(): void {
  void signOut({ callbackUrl: '/login' });
}

export function Header(): ReactElement | null {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  const { user } = session;

  return (
    <header className='border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex h-14 w-full shrink-0 items-center gap-2 border-b backdrop-blur'>
      <div className='flex flex-1 items-center justify-between px-4'>
        <div className='flex items-center gap-2'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2 h-4' />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              className='focus-visible:ring-ring rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
            >
              <Avatar className='size-8 cursor-pointer'>
                <AvatarImage
                  src={user.image ?? undefined}
                  alt={user.name ?? 'Avatar'}
                />
                <AvatarFallback className='text-xs'>
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-56'>
            <DropdownMenuLabel className='font-normal'>
              <div className='flex flex-col space-y-1'>
                <p className='text-sm leading-none font-medium'>{user.name}</p>
                <p className='text-muted-foreground text-xs leading-none'>
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className='cursor-pointer'
            >
              <LogOut className='mr-2 size-4' />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
