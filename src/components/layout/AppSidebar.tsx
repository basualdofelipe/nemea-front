'use client';

import type { ReactElement } from 'react';
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

const FINANZAS_ITEMS: NavItem[] = [
  { label: 'Gastos', href: '/finanzas/gastos', icon: Receipt },
];

const HERRAMIENTAS_ITEMS: NavItem[] = [
  { label: 'Calculadora', href: '/calculadora', icon: Calculator },
  { label: 'Escenarios', href: '/escenarios', icon: LineChart },
];

const PRODUCTOS_ITEMS: NavItem[] = [
  { label: 'Productos', href: '/productos', icon: ShoppingBag },
];

const DATOS_BASE_ITEMS: NavItem[] = [
  { label: 'Catalogos', href: '/catalogos', icon: BookOpen },
  { label: 'Proveedores', href: '/proveedores', icon: Truck },
  { label: 'Insumos', href: '/insumos', icon: Package },
];

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

  // Build admin items dynamically based on permissions
  const adminItems: NavItem[] = [];
  if (canManageUsers) {
    adminItems.push({ label: 'Usuarios', href: '/usuarios', icon: Users });
    adminItems.push({ label: 'Roles', href: '/roles', icon: Shield });
  }
  if (canManageConfig) {
    adminItems.push({
      label: 'Config Tiendanube',
      href: '/configuracion/tiendanube',
      icon: Settings,
    });
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
        {canViewExpenses && (
          <SidebarGroup>
            <SidebarGroupLabel>Finanzas</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderNavItems(FINANZAS_ITEMS)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {(canUseCalculator || canManageScenarios) && (
          <SidebarGroup>
            <SidebarGroupLabel>Herramientas</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderNavItems(HERRAMIENTAS_ITEMS)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {canViewProducts && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>{renderNavItems(PRODUCTOS_ITEMS)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {(canViewProducts || canViewSupplies) && (
          <SidebarGroup>
            <SidebarGroupLabel>Datos base</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderNavItems(DATOS_BASE_ITEMS)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {(canManageUsers || canManageConfig) && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderNavItems(adminItems)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
