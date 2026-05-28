'use client';

import type { ReactElement } from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClientFetch } from '@/lib/api-client';
import type { Product } from '@/components/products/types';
import type { TiendanubeConfigAll } from '@/components/tiendanube-config/types';
import type {
  CalcResult,
  CalcInverseResult,
} from '@/components/calculadora/types';
import { ModeToggle } from '@/components/calculadora/ModeToggle';
import { ProductSelector } from '@/components/calculadora/ProductSelector';
import {
  GatewaySelectors,
  type GatewayConfig,
} from '@/components/calculadora/GatewaySelectors';
import { DesglosePanel } from '@/components/calculadora/DesglosePanel';

type CalcMode = 'forward' | 'inverse';

interface CalculadoraClientProps {
  products: Product[];
  config: TiendanubeConfigAll;
}

const DEBOUNCE_MS = 300;

export function CalculadoraClient({
  products,
  config,
}: CalculadoraClientProps): ReactElement {
  const { data: session } = useSession();

  const [mode, setMode] = useState<CalcMode>('forward');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [precioVenta, setPrecioVenta] = useState<string>('');
  const [costoEnvio, setCostoEnvio] = useState<string>('');
  const [gananciaDeseada, setGananciaDeseada] = useState<string>('');
  const [result, setResult] = useState<CalcResult | CalcInverseResult | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfig | null>(
    null,
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup debounce on unmount
  useEffect(() => {
    return (): void => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const calculate = useCallback(async (): Promise<void> => {
    if (!session?.accessToken || !selectedProduct || !gatewayConfig) return;

    const envio = parseFloat(costoEnvio) || 0;

    if (mode === 'forward') {
      const precio = parseFloat(precioVenta);
      if (!precio || precio <= 0) return;

      setLoading(true);
      try {
        const res = await apiClientFetch<{ data: CalcResult }>(
          '/api/calculadora/forward',
          session.accessToken,
          {
            method: 'POST',
            body: JSON.stringify({
              productId: selectedProduct.id,
              precioVenta: precio,
              costoEnvio: envio,
              gatewaySlug: gatewayConfig.gatewaySlug,
              paymentMethod: gatewayConfig.paymentMethod,
              withdrawalDays: gatewayConfig.withdrawalDays,
              installments: gatewayConfig.installments,
              planSlug: gatewayConfig.planSlug,
            }),
          },
        );
        setResult(res.data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Error en el calculo';
        toast.error(message);
        setResult(null);
      } finally {
        setLoading(false);
      }
    } else {
      const ganancia = parseFloat(gananciaDeseada);
      if (!ganancia || ganancia <= 0) return;

      setLoading(true);
      try {
        const res = await apiClientFetch<{ data: CalcInverseResult }>(
          '/api/calculadora/inverse',
          session.accessToken,
          {
            method: 'POST',
            body: JSON.stringify({
              productId: selectedProduct.id,
              gananciaDeseada: ganancia,
              costoEnvio: envio,
              gatewaySlug: gatewayConfig.gatewaySlug,
              paymentMethod: gatewayConfig.paymentMethod,
              withdrawalDays: gatewayConfig.withdrawalDays,
              installments: gatewayConfig.installments,
              planSlug: gatewayConfig.planSlug,
            }),
          },
        );
        setResult(res.data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Error en el calculo';
        toast.error(message);
        setResult(null);
      } finally {
        setLoading(false);
      }
    }
  }, [
    session?.accessToken,
    selectedProduct,
    gatewayConfig,
    mode,
    precioVenta,
    costoEnvio,
    gananciaDeseada,
  ]);

  const debouncedCalculate = useCallback((): void => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void calculate();
    }, DEBOUNCE_MS);
  }, [calculate]);

  // Trigger calculation on input changes
  useEffect(() => {
    if (!selectedProduct || !gatewayConfig) return;

    if (mode === 'forward' && parseFloat(precioVenta) > 0) {
      debouncedCalculate();
    } else if (mode === 'inverse' && parseFloat(gananciaDeseada) > 0) {
      debouncedCalculate();
    }
  }, [
    mode,
    selectedProduct,
    precioVenta,
    costoEnvio,
    gananciaDeseada,
    gatewayConfig,
    debouncedCalculate,
  ]);

  const handleModeChange = useCallback((newMode: CalcMode): void => {
    setMode(newMode);
    setResult(null);
  }, []);

  const handleProductSelect = useCallback((product: Product): void => {
    setSelectedProduct(product);
    setResult(null);
  }, []);

  const handleGatewayConfigChange = useCallback(
    (newConfig: GatewayConfig): void => {
      setGatewayConfig(newConfig);
    },
    [],
  );

  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
      {/* Left column: Inputs */}
      <div className='space-y-4'>
        {/* Mode toggle */}
        <Card>
          <CardContent className='pt-6'>
            <ModeToggle mode={mode} onModeChange={handleModeChange} />
          </CardContent>
        </Card>

        {/* Product selector */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductSelector
              products={products}
              selectedProductId={selectedProduct?.id ?? null}
              onProductSelect={handleProductSelect}
            />
          </CardContent>
        </Card>

        {/* Price / Profit input */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>
              {mode === 'forward' ? 'Precio de venta' : 'Ganancia deseada'}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {mode === 'forward' ? (
              <div className='space-y-1.5'>
                <Label>Precio de venta</Label>
                <div className='relative'>
                  <span className='text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm'>
                    $
                  </span>
                  <Input
                    type='number'
                    placeholder='0'
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(e.target.value)}
                    className='pl-7'
                    min={0}
                    step='0.01'
                  />
                </div>
              </div>
            ) : (
              <div className='space-y-1.5'>
                <Label>Ganancia deseada</Label>
                <div className='relative'>
                  <span className='text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm'>
                    $
                  </span>
                  <Input
                    type='number'
                    placeholder='0'
                    value={gananciaDeseada}
                    onChange={(e) => setGananciaDeseada(e.target.value)}
                    className='pl-7'
                    min={0}
                    step='0.01'
                  />
                </div>
              </div>
            )}

            <div className='space-y-1.5'>
              <Label>Costo de envio</Label>
              <div className='relative'>
                <span className='text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm'>
                  $
                </span>
                <Input
                  type='number'
                  placeholder='0'
                  value={costoEnvio}
                  onChange={(e) => setCostoEnvio(e.target.value)}
                  className='pl-7'
                  min={0}
                  step='0.01'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gateway selectors */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Pasarela de pago</CardTitle>
          </CardHeader>
          <CardContent>
            <GatewaySelectors
              config={config}
              onConfigChange={handleGatewayConfigChange}
            />
          </CardContent>
        </Card>
      </div>

      {/* Right column: Results */}
      <div>
        <Card className='lg:sticky lg:top-6'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Calculator className='size-4' />
              Desglose
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='text-muted-foreground size-6 animate-spin' />
              </div>
            ) : result ? (
              <DesglosePanel
                result={result}
                mode={mode}
                installments={gatewayConfig?.installments ?? 1}
              />
            ) : (
              <div className='text-muted-foreground py-12 text-center text-sm'>
                Selecciona un producto y completa los datos para ver el
                desglose.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
