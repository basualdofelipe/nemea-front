'use client';

import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePermissions } from '@/hooks/usePermissions';
import type { CatalogItem, Product } from './types';
import { getProductDisplayName } from './types';
import { ProductTypeGroup } from './ProductTypeGroup';
import { ProductBatchCreateDialog } from './ProductBatchCreateDialog';
import type { SupplyOption } from '@/types/supply';

interface ProductTableProps {
  initialProducts: Product[];
  types: CatalogItem[];
  names: CatalogItem[];
  finishes: CatalogItem[];
  colors: CatalogItem[];
  sizes: CatalogItem[];
  supplies: SupplyOption[];
  canEdit: boolean;
}

export function ProductTable({
  initialProducts,
  types,
  names,
  finishes,
  colors,
  sizes,
  supplies,
  canEdit: canEditProp,
}: ProductTableProps): ReactElement {
  const { canEditProducts } = usePermissions();
  const canEdit = canEditProp ?? canEditProducts;

  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filteredProducts = useMemo((): Product[] => {
    return initialProducts.filter((product) => {
      if (!showInactive && !product.isActive) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const displayName = getProductDisplayName(product).toLowerCase();
        const sku = product.skuCode.toLowerCase();
        if (!displayName.includes(query) && !sku.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [initialProducts, searchQuery, showInactive]);

  const groupedProducts = useMemo((): Record<string, Product[]> => {
    const groups: Record<string, Product[]> = {};
    for (const product of filteredProducts) {
      const typeId = product.type.id;
      if (!groups[typeId]) {
        groups[typeId] = [];
      }
      groups[typeId].push(product);
    }
    return groups;
  }, [filteredProducts]);

  const sortedTypeIds = useMemo((): string[] => {
    return Object.keys(groupedProducts).sort((a, b) => {
      const nameA = groupedProducts[a][0].type.name;
      const nameB = groupedProducts[b][0].type.name;
      return nameA.localeCompare(nameB);
    });
  }, [groupedProducts]);

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-4'>
        <div className='relative min-w-[200px] flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            placeholder='Buscar producto o SKU...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>

        <div className='flex items-center gap-2'>
          <Switch
            id='show-inactive-products'
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <Label htmlFor='show-inactive-products' className='text-sm'>
            Mostrar inactivos
          </Label>
        </div>

        {canEdit && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className='mr-1 size-4' />
            Crear productos
          </Button>
        )}
      </div>

      {sortedTypeIds.length === 0 ? (
        <div className='text-muted-foreground rounded-md border py-12 text-center'>
          {searchQuery
            ? 'No se encontraron productos con los filtros seleccionados.'
            : 'No hay productos registrados.'}
        </div>
      ) : (
        <div className='space-y-4'>
          {sortedTypeIds.map((typeId) => (
            <ProductTypeGroup
              key={typeId}
              typeName={groupedProducts[typeId][0].type.name}
              products={groupedProducts[typeId]}
              supplies={supplies}
              types={types}
              names={names}
              finishes={finishes}
              colors={colors}
              sizes={sizes}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}

      <ProductBatchCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        types={types}
        names={names}
        finishes={finishes}
        colors={colors}
        sizes={sizes}
      />
    </div>
  );
}
