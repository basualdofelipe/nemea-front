'use client';

import type { ReactElement } from 'react';

interface SupplyType {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Supply {
  id: string;
  name: string;
  type: SupplyType;
  supplier: Supplier;
  unitType: 'm2' | 'unidad' | 'metro' | 'kg';
  notes: string | null;
  isActive: boolean;
  currentPrice: number | null;
  lastPriceUpdate: string | null;
  createdAt: string;
}

interface SupplyTableProps {
  initialSupplies: Supply[];
  supplyTypes: SupplyType[];
  suppliers: Supplier[];
  isAdmin: boolean;
}

export function SupplyTable({
  initialSupplies: _initialSupplies,
  supplyTypes: _supplyTypes,
  suppliers: _suppliers,
  isAdmin: _isAdmin,
}: SupplyTableProps): ReactElement {
  return (
    <div>
      <p>Cargando insumos...</p>
    </div>
  );
}

export type { Supply, SupplyType, Supplier };
