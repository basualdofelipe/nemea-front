export interface SupplyOption {
  id: string;
  name: string;
  unitType: 'm2' | 'unidad' | 'metro' | 'kg';
  isActive: boolean;
  type: { name: string };
  supplier?: { name: string };
}

export type UnitType = SupplyOption['unitType'];

export const UNIT_LABELS: Record<UnitType, string> = {
  m2: 'm\u00B2',
  unidad: 'un.',
  metro: 'm',
  kg: 'kg',
};
