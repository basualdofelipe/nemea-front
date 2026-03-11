import type { ReactElement } from 'react';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CatalogTabContent } from '@/components/catalogs/CatalogTabContent';

interface CatalogItem {
  id: string;
  name: string;
}

interface CatalogResponse {
  data: CatalogItem[];
}

const DIMENSIONS = [
  { key: 'product-types', label: 'Tipos' },
  { key: 'product-names', label: 'Nombres' },
  { key: 'product-finishes', label: 'Terminaciones' },
  { key: 'product-colors', label: 'Colores' },
  { key: 'product-sizes', label: 'Talles' },
  { key: 'supply-types', label: 'Tipos de Insumo' },
  { key: 'expense-categories', label: 'Categorias de Gasto' },
];

export default async function CatalogosPage(): Promise<ReactElement> {
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';

  const results = await Promise.all(
    DIMENSIONS.map((d) => apiFetch<CatalogResponse>(`/api/catalogs/${d.key}`)),
  );

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Catalogos</h1>
        <p className='text-muted-foreground text-sm'>
          Gestiona los catalogos de productos e insumos.
        </p>
      </div>

      <Tabs defaultValue={DIMENSIONS[0].key}>
        <TabsList className='flex-wrap'>
          {DIMENSIONS.map((d) => (
            <TabsTrigger key={d.key} value={d.key}>
              {d.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {DIMENSIONS.map((d, i) => (
          <TabsContent key={d.key} value={d.key}>
            <CatalogTabContent
              dimension={d.key}
              initialItems={results[i].data}
              isAdmin={isAdmin}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
