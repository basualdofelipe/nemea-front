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

export const UNIT_LABELS: Record<Supply['unitType'], string> = {
  m2: 'm\u00B2',
  unidad: 'un.',
  metro: 'm',
  kg: 'kg',
};

export function formatPrice(
  price: number | null,
  unitType: Supply['unitType'],
): string {
  if (price === null) return 'Sin precio';
  return `$${price.toLocaleString('es-AR')}/${UNIT_LABELS[unitType]}`;
}
