'use client';

import { Fragment, type ReactElement } from 'react';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Supply, SupplyType, Supplier } from './types';
import { formatPrice } from './types';
import { SupplyExpandedRow } from './SupplyExpandedRow';

interface SupplyTypeGroupProps {
  typeName: string;
  supplies: Supply[];
  supplyTypes: SupplyType[];
  allSuppliers: Supplier[];
  canEdit: boolean;
}

export function SupplyTypeGroup({
  typeName,
  supplies,
  supplyTypes,
  allSuppliers,
  canEdit,
}: SupplyTypeGroupProps): ReactElement {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const colSpan = 4;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className='hover:bg-muted/50 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors'>
        <ChevronDown
          className={`size-4 shrink-0 transition-transform duration-200 ${
            isOpen ? '' : '-rotate-90'
          }`}
        />
        <span className='font-medium'>{typeName}</span>
        <Badge variant='secondary' className='ml-1'>
          {supplies.length} {supplies.length === 1 ? 'insumo' : 'insumos'}
        </Badge>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Precio Actual</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplies.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={colSpan}
                    className='text-muted-foreground h-16 text-center'
                  >
                    No hay insumos en esta categoria.
                  </TableCell>
                </TableRow>
              ) : (
                supplies.map((supply) => (
                  <Fragment key={supply.id}>
                    <TableRow
                      className={`cursor-pointer ${
                        !supply.isActive ? 'opacity-50' : ''
                      } ${expandedId === supply.id ? 'bg-muted/30' : ''}`}
                      onClick={() =>
                        setExpandedId(
                          expandedId === supply.id ? null : supply.id,
                        )
                      }
                    >
                      <TableCell className='font-medium'>
                        {supply.name}
                      </TableCell>
                      <TableCell>{supply.supplier.name}</TableCell>
                      <TableCell>
                        {formatPrice(supply.currentPrice, supply.unitType)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={supply.isActive ? 'default' : 'destructive'}
                        >
                          {supply.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {expandedId === supply.id && (
                      <SupplyExpandedRow
                        key={`${supply.id}-expanded`}
                        supply={supply}
                        supplyTypes={supplyTypes}
                        suppliers={allSuppliers}
                        canEdit={canEdit}
                        colSpan={colSpan}
                      />
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
