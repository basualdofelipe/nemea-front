import type { ReactElement } from 'react';
import Link from 'next/link';
import { ShoppingBag, Calculator, Package, Receipt } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/auth';
import { NO_PERMISSIONS, type Permissions } from '@/types/permissions';

interface QuickLinkCard {
  label: string;
  href: string;
  icon: typeof ShoppingBag;
  show: boolean;
}

export default async function Home(): Promise<ReactElement> {
  const session = await auth();
  const permissions: Permissions = session?.user?.permissions ?? NO_PERMISSIONS;

  const allCards: QuickLinkCard[] = [
    {
      label: 'Productos',
      href: '/productos',
      icon: ShoppingBag,
      show: permissions.canViewProducts,
    },
    {
      label: 'Calculadora',
      href: '/calculadora',
      icon: Calculator,
      show: permissions.canUseCalculator,
    },
    {
      label: 'Insumos',
      href: '/insumos',
      icon: Package,
      show: permissions.canViewSupplies,
    },
    {
      label: 'Gastos',
      href: '/finanzas/gastos',
      icon: Receipt,
      show: permissions.canViewExpenses,
    },
  ];

  const visibleCards = allCards.filter((card) => card.show);

  return (
    <div className='p-6'>
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
        {visibleCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className='hover:bg-muted/50 cursor-pointer transition-colors'>
              <CardHeader className='flex flex-col items-center gap-2 text-center'>
                <card.icon className='text-primary size-8' />
                <CardTitle className='text-base font-semibold'>
                  {card.label}
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
