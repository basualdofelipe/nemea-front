// NEXT_PUBLIC_* se inlinean en build time — rebuild requerido para cambios.
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Hefesto';
export const DEMO_EMAIL =
  process.env.NEXT_PUBLIC_DEMO_EMAIL ?? 'demo@hefesto.com';
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'admin@hefesto.com';
