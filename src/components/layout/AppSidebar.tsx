'use client';

import type { ReactElement } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Home,
  BookOpen,
  Truck,
  Package,
  ShoppingBag,
  Receipt,
  Users,
  Settings,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface NavItem {
  label: string;
  href: string;
  icon: typeof Home;
}

const TOP_ITEMS: NavItem[] = [{ label: 'Inicio', href: '/', icon: Home }];

const FINANZAS_ITEMS: NavItem[] = [
  { label: 'Gastos', href: '/finanzas/gastos', icon: Receipt },
];

const PRODUCTOS_ITEMS: NavItem[] = [
  { label: 'Productos', href: '/productos', icon: ShoppingBag },
];

const DATOS_BASE_ITEMS: NavItem[] = [
  { label: 'Catalogos', href: '/catalogos', icon: BookOpen },
  { label: 'Proveedores', href: '/proveedores', icon: Truck },
  { label: 'Insumos', href: '/insumos', icon: Package },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: 'Usuarios', href: '/usuarios', icon: Users },
  {
    label: 'Config Tiendanube',
    href: '/configuracion/tiendanube',
    icon: Settings,
  },
];

export function AppSidebar(): ReactElement {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  function isActive(href: string): boolean {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  }

  function renderNavItems(items: NavItem[]): ReactElement[] {
    return items.map((item) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={isActive(item.href)}
          tooltip={item.label}
        >
          <Link href={item.href}>
            <item.icon />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));
  }

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='p-4'>
        <Link href='/' className='flex items-center gap-2'>
          <span className='engraving-title text-primary text-xl tracking-widest group-data-[collapsible=icon]:hidden'>
            NEMEA
          </span>
          <span className='engraving-title text-primary hidden text-xl tracking-widest group-data-[collapsible=icon]:block'>
            N
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(TOP_ITEMS)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Finanzas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(FINANZAS_ITEMS)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(PRODUCTOS_ITEMS)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Datos base</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(DATOS_BASE_ITEMS)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderNavItems(ADMIN_ITEMS)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
