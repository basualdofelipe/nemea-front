export interface SupplyType {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
}

export interface Supply {
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

export interface PriceRecord {
  id: string;
  price: string; // decimal from backend
  createdAt: string;
}

import { UNIT_LABELS } from '@/types/supply';

export { UNIT_LABELS };

export function formatPrice(
  price: number | null,
  unitType: Supply['unitType'],
): string {
  if (price === null) return 'Sin precio';
  return `$${price.toLocaleString('es-AR')}/${UNIT_LABELS[unitType]}`;
}
