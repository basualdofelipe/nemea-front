export interface CatalogItem {
  id: string;
  name: string;
  skuCode: number;
}

export interface ProductDimension {
  id: string;
  name: string;
  skuCode: number;
}

export interface Product {
  id: string;
  skuCode: string;
  type: ProductDimension;
  name: ProductDimension;
  finish: ProductDimension;
  color: ProductDimension;
  size: ProductDimension;
  isActive: boolean;
  currentPrice: number | null;
  lastPriceUpdate: string | null;
  createdAt: string;
}

export interface BomItem {
  id: string;
  supply: {
    id: string;
    name: string;
    unitType: 'm2' | 'unidad' | 'metro' | 'kg';
    isActive: boolean;
    type: { name: string };
  };
  quantity: string;
  isActive: boolean;
}

export interface PriceRecord {
  id: string;
  price: string;
  createdAt: string;
}

export function getProductDisplayName(product: Product): string {
  const parts = [
    product.type.name,
    product.name.name,
    product.finish.name,
    product.color.name,
  ];
  if (product.size.name !== 'Talle Unico') parts.push(product.size.name);
  return parts.join(' ');
}

export function formatSellingPrice(price: number | null): string {
  if (price === null) return '\u2014';
  return `$${price.toLocaleString('es-AR')}`;
}
