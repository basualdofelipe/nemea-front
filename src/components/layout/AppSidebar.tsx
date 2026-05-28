'use client';

import type { ReactElement } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  Truck,
  Package,
  ShoppingBag,
  Receipt,
  Calculator,
  LineChart,
  Users,
  Settings,
  Shield,
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
import { usePermissions } from '@/hooks/usePermissions';

interface NavItem {
  label: string;
  href: string;
  icon: typeof Home;
}

const TOP_ITEMS: NavItem[] = [{ label: 'Inicio', href: '/', icon: Home }];

export function AppSidebar(): ReactElement {
  const pathname = usePathname();
  const {
    canManageUsers,
    canManageConfig,
    canViewProducts,
    canViewSupplies,
    canViewExpenses,
    canUseCalculator,
    canManageScenarios,
  } = usePermissions();

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
          <Image
            src='/brand/logo.png'
            alt='NEMEA'
            width={100}
            height={100}
            className='h-12 w-auto object-contain group-data-[collapsible=icon]:hidden'
          />
          <Image
            src='/brand/Isotipo.png'
            alt='NEMEA'
            width={28}
            height={28}
            className='hidden size-7 object-contain group-data-[collapsible=icon]:block'
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(TOP_ITEMS)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {canViewExpenses && (
          <SidebarGroup>
            <SidebarGroupLabel>Finanzas</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderNavItems([
                  { label: 'Gastos', href: '/finanzas/gastos', icon: Receipt },
                ])}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {(canUseCalculator || canManageScenarios) && (
          <SidebarGroup>
            <SidebarGroupLabel>Herramientas</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {canUseCalculator &&
                  renderNavItems([
                    {
                      label: 'Calculadora',
                      href: '/calculadora',
                      icon: Calculator,
                    },
                  ])}
                {canManageScenarios &&
                  renderNavItems([
                    {
                      label: 'Escenarios',
                      href: '/escenarios',
                      icon: LineChart,
                    },
                  ])}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {canViewProducts && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderNavItems([
                  {
                    label: 'Productos',
                    href: '/productos',
                    icon: ShoppingBag,
                  },
                ])}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {(canViewProducts || canViewSupplies) && (
          <SidebarGroup>
            <SidebarGroupLabel>Datos base</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {canViewProducts &&
                  renderNavItems([
                    {
                      label: 'Catalogos',
                      href: '/catalogos',
                      icon: BookOpen,
                    },
                  ])}
                {canViewSupplies &&
                  renderNavItems([
                    {
                      label: 'Proveedores',
                      href: '/proveedores',
                      icon: Truck,
                    },
                    { label: 'Insumos', href: '/insumos', icon: Package },
                  ])}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {(canManageUsers || canManageConfig) && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {canManageUsers &&
                  renderNavItems([
                    { label: 'Usuarios', href: '/usuarios', icon: Users },
                    { label: 'Roles', href: '/roles', icon: Shield },
                  ])}
                {canManageConfig &&
                  renderNavItems([
                    {
                      label: 'Config Tiendanube',
                      href: '/configuracion/tiendanube',
                      icon: Settings,
                    },
                  ])}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
