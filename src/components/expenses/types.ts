export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  amount: string; // decimal from backend (parse with parseFloat)
  concept: string;
  date: string; // "YYYY-MM-DD" format from PostgreSQL DATE
  category: ExpenseCategory;
  createdAt: string;
  updatedAt: string;
}

interface CategoryColorClasses {
  bg: string;
  text: string;
}

const CATEGORY_COLORS: Record<string, CategoryColorClasses> = {
  'materia prima': { bg: 'bg-amber-100', text: 'text-amber-800' },
  packaging: { bg: 'bg-blue-100', text: 'text-blue-800' },
  envio: { bg: 'bg-green-100', text: 'text-green-800' },
  herramientas: { bg: 'bg-purple-100', text: 'text-purple-800' },
  servicios: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  otros: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

const DEFAULT_COLOR: CategoryColorClasses = {
  bg: 'bg-gray-100',
  text: 'text-gray-800',
};

export function getCategoryColor(name: string): string {
  const colors = CATEGORY_COLORS[name.toLowerCase()] ?? DEFAULT_COLOR;
  return `${colors.bg} ${colors.text}`;
}

export function formatAmount(amount: string): string {
  return parseFloat(amount).toLocaleString('es-AR');
}

export function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  const label = date.toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDateDisplay(dateStr: string): string {
  // "2026-03-06" -> "06/03/2026" without Date constructor to avoid timezone shift
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function groupByMonth(expenses: Expense[]): Map<string, Expense[]> {
  const map = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const key = expense.date.substring(0, 7);
    const group = map.get(key);
    if (group) {
      group.push(expense);
    } else {
      map.set(key, [expense]);
    }
  }
  return map;
}

export function getCurrentMonthRange(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const pad = (n: number): string => n.toString().padStart(2, '0');

  return {
    dateFrom: `${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-${pad(firstDay.getDate())}`,
    dateTo: `${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(lastDay.getDate())}`,
  };
}
