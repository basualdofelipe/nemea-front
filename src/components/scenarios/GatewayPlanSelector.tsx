'use client';

import type { ReactElement } from 'react';
import { useMemo, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TiendanubeConfigAll } from '@/components/tiendanube-config/types';
import { PAYMENT_METHOD_LABELS } from '@/components/tiendanube-config/types';
import { TN_PAYMENT_TARJETA } from '@/constants/tiendanube';
import type { GatewayPlanConfig } from './types';

interface GatewayPlanSelectorProps {
  config: TiendanubeConfigAll;
  value: GatewayPlanConfig;
  onChange: (config: GatewayPlanConfig) => void;
}

export function GatewayPlanSelector({
  config,
  value,
  onChange,
}: GatewayPlanSelectorProps): ReactElement {
  // Use ref for callback to prevent it from being a useEffect dependency
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const activeGateways = useMemo(
    () => config.gateways.filter((g) => g.isActive),
    [config.gateways],
  );

  const activeRates = useMemo(
    () => config.rates.filter((r) => r.isActive),
    [config.rates],
  );

  const activeInstallments = useMemo(
    () =>
      config.installments
        .filter((i) => i.isActive)
        .sort((a, b) => a.installments - b.installments),
    [config.installments],
  );

  // Derive available methods from current gateway
  const availableMethods = useMemo((): string[] => {
    const methods = new Set<string>();
    for (const rate of activeRates) {
      if (rate.gateway.slug === value.gatewaySlug) {
        methods.add(rate.paymentMethod);
      }
    }
    return Array.from(methods);
  }, [activeRates, value.gatewaySlug]);

  // Derive available withdrawal days from gateway + method
  const availableWithdrawalDays = useMemo((): number[] => {
    const days = new Set<number>();
    for (const rate of activeRates) {
      if (
        rate.gateway.slug === value.gatewaySlug &&
        rate.paymentMethod === value.paymentMethod
      ) {
        days.add(rate.withdrawalDays);
      }
    }
    return Array.from(days).sort((a, b) => a - b);
  }, [activeRates, value.gatewaySlug, value.paymentMethod]);

  function handleGatewayChange(newSlug: string): void {
    const availableRates = activeRates.filter(
      (r) => r.gateway.slug === newSlug,
    );
    const methods = [...new Set(availableRates.map((r) => r.paymentMethod))];
    const newMethod = methods[0] ?? TN_PAYMENT_TARJETA;
    const dayOptions = availableRates
      .filter((r) => r.paymentMethod === newMethod)
      .map((r) => r.withdrawalDays);
    const newDays = dayOptions[0] ?? 1;

    onChangeRef.current({
      gatewaySlug: newSlug,
      paymentMethod: newMethod,
      withdrawalDays: newDays,
      installments: value.installments,
      planId: value.planId,
    });
  }

  function handleMethodChange(newMethod: string): void {
    const dayOptions = activeRates
      .filter(
        (r) =>
          r.gateway.slug === value.gatewaySlug && r.paymentMethod === newMethod,
      )
      .map((r) => r.withdrawalDays);
    const newDays = dayOptions[0] ?? 1;

    onChangeRef.current({
      ...value,
      paymentMethod: newMethod,
      withdrawalDays: newDays,
    });
  }

  function handleDaysChange(days: string): void {
    onChangeRef.current({
      ...value,
      withdrawalDays: Number(days),
    });
  }

  function handleInstallmentsChange(inst: string): void {
    onChangeRef.current({
      ...value,
      installments: Number(inst),
    });
  }

  function handlePlanChange(planId: string): void {
    onChangeRef.current({
      ...value,
      planId,
    });
  }

  return (
    <Card>
      <CardContent className='pt-4'>
        <div className='flex flex-wrap gap-4'>
          <div className='min-w-[160px] flex-1 space-y-1.5'>
            <Label>Pasarela</Label>
            <Select
              value={value.gatewaySlug}
              onValueChange={handleGatewayChange}
            >
              <SelectTrigger>
                <SelectValue placeholder='Selecciona pasarela' />
              </SelectTrigger>
              <SelectContent>
                {activeGateways.map((gw) => (
                  <SelectItem key={gw.slug} value={gw.slug}>
                    {gw.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='min-w-[160px] flex-1 space-y-1.5'>
            <Label>Plan</Label>
            <Select value={value.planId} onValueChange={handlePlanChange}>
              <SelectTrigger>
                <SelectValue placeholder='Selecciona plan' />
              </SelectTrigger>
              <SelectContent>
                {config.plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='min-w-[160px] flex-1 space-y-1.5'>
            <Label>Medio de pago</Label>
            <Select
              value={value.paymentMethod}
              onValueChange={handleMethodChange}
            >
              <SelectTrigger>
                <SelectValue placeholder='Selecciona medio' />
              </SelectTrigger>
              <SelectContent>
                {availableMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method] ?? method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='min-w-[120px] flex-1 space-y-1.5'>
            <Label>Plazo</Label>
            <Select
              value={String(value.withdrawalDays)}
              onValueChange={handleDaysChange}
            >
              <SelectTrigger>
                <SelectValue placeholder='Selecciona plazo' />
              </SelectTrigger>
              <SelectContent>
                {availableWithdrawalDays.map((days) => (
                  <SelectItem key={days} value={String(days)}>
                    {days} dias
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='min-w-[120px] flex-1 space-y-1.5'>
            <Label>Cuotas</Label>
            <Select
              value={String(value.installments)}
              onValueChange={handleInstallmentsChange}
            >
              <SelectTrigger>
                <SelectValue placeholder='Selecciona cuotas' />
              </SelectTrigger>
              <SelectContent>
                {activeInstallments.map((inst) => (
                  <SelectItem
                    key={inst.installments}
                    value={String(inst.installments)}
                  >
                    {inst.installments === 1
                      ? '1 cuota (sin interes)'
                      : `${inst.installments} cuotas`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
