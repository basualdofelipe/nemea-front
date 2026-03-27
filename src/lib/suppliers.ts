import type { SupplierFormData } from '@/components/suppliers/SupplierForm';

export function cleanSupplierData(
  data: SupplierFormData,
): Record<string, string | undefined> {
  return {
    name: data.name,
    address: data.address || undefined,
    email: data.email || undefined,
    phone: data.phone || undefined,
    whatsapp: data.whatsapp || undefined,
    description: data.description || undefined,
  };
}
