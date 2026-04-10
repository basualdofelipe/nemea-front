export interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
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
  userCount: number;
}

export interface RoleOption {
  id: string;
  name: string;
}
