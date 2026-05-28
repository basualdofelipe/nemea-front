export interface Permissions {
  canViewProducts: boolean;
  canEditProducts: boolean;
  canViewSupplies: boolean;
  canEditSupplies: boolean;
  canViewExpenses: boolean;
  canEditExpenses: boolean;
  canUseCalculator: boolean;
  canManageScenarios: boolean;
  canViewDashboard: boolean;
  canManageConfig: boolean;
  canManageUsers: boolean;
}

export const NO_PERMISSIONS: Permissions = {
  canViewProducts: false,
  canEditProducts: false,
  canViewSupplies: false,
  canEditSupplies: false,
  canViewExpenses: false,
  canEditExpenses: false,
  canUseCalculator: false,
  canManageScenarios: false,
  canViewDashboard: false,
  canManageConfig: false,
  canManageUsers: false,
};

export const PERMISSION_KEYS = [
  'canViewProducts',
  'canEditProducts',
  'canViewSupplies',
  'canEditSupplies',
  'canViewExpenses',
  'canEditExpenses',
  'canUseCalculator',
  'canManageScenarios',
  'canViewDashboard',
  'canManageConfig',
  'canManageUsers',
] as const satisfies readonly (keyof Permissions)[];
