import type { ReactElement } from 'react';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import type { Expense, ExpenseCategory } from '@/components/expenses/types';
import { getCurrentMonthRange } from '@/components/expenses/types';

interface ExpenseListResponse {
  data: Expense[];
}

interface CategoryListResponse {
  data: ExpenseCategory[];
}

export default async function GastosPage(): Promise<ReactElement> {
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';

  const { dateFrom, dateTo } = getCurrentMonthRange();

  const [categoriesRes, expensesRes] = await Promise.all([
    apiFetch<CategoryListResponse>('/api/catalogs/expense-categories'),
    apiFetch<ExpenseListResponse>(
      `/api/expenses?dateFrom=${dateFrom}&dateTo=${dateTo}`,
    ),
  ]);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Gastos</h1>
        <p className='text-muted-foreground text-sm'>
          Registra y gestiona los gastos del negocio.
        </p>
      </div>

      <ExpenseTable
        initialExpenses={expensesRes.data}
        categories={categoriesRes.data}
        isAdmin={isAdmin}
      />
    </div>
  );
}
