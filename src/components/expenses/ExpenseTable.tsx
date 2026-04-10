'use client';

import { useState, useMemo, useCallback, type ReactElement } from 'react';
import { useSession } from 'next-auth/react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClientFetch } from '@/lib/api-client';
import type { Expense, ExpenseCategory } from './types';
import { formatAmount, groupByMonth, getCurrentMonthRange } from './types';
import { ExpenseMonthGroup } from './ExpenseMonthGroup';
import { ExpenseFormDialog } from './ExpenseFormDialog';
import { DeleteExpenseDialog } from './DeleteExpenseDialog';

interface ExpenseTableProps {
  initialExpenses: Expense[];
  categories: ExpenseCategory[];
  isAdmin: boolean;
}

interface ExpenseListResponse {
  data: Expense[];
}

const ALL_CATEGORIES = '__all__';

export function ExpenseTable({
  initialExpenses,
  categories,
  isAdmin,
}: ExpenseTableProps): ReactElement {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const defaultRange = getCurrentMonthRange();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [selectedCategory, setSelectedCategory] =
    useState<string>(ALL_CATEGORIES);
  const [dateFrom, setDateFrom] = useState(defaultRange.dateFrom);
  const [dateTo, setDateTo] = useState(defaultRange.dateTo);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(
    undefined,
  );
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchExpenses = useCallback(
    async (catId: string, from: string, to: string): Promise<void> => {
      try {
        const params = new URLSearchParams();
        if (catId !== ALL_CATEGORIES) params.set('categoryId', catId);
        if (from) params.set('dateFrom', from);
        if (to) params.set('dateTo', to);
        const query = params.toString();
        const url = `/api/expenses${query ? `?${query}` : ''}`;
        const res = await apiClientFetch<ExpenseListResponse>(url, token);
        setExpenses(res.data);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Error al cargar gastos',
        );
      }
    },
    [token],
  );

  function handleCategoryChange(value: string): void {
    setSelectedCategory(value);
    void fetchExpenses(value, dateFrom, dateTo);
  }

  function handleDateFromChange(value: string): void {
    setDateFrom(value);
    void fetchExpenses(selectedCategory, value, dateTo);
  }

  function handleDateToChange(value: string): void {
    setDateTo(value);
    void fetchExpenses(selectedCategory, dateFrom, value);
  }

  function handleEdit(expense: Expense): void {
    setEditingExpense(expense);
    setFormDialogOpen(true);
  }

  function handleDelete(expense: Expense): void {
    setDeletingExpense(expense);
    setDeleteDialogOpen(true);
  }

  function handleFormClose(open: boolean): void {
    setFormDialogOpen(open);
    if (!open) setEditingExpense(undefined);
  }

  function handleSuccess(): void {
    void fetchExpenses(selectedCategory, dateFrom, dateTo);
  }

  const monthGroups = useMemo(() => groupByMonth(expenses), [expenses]);

  const { totalAmount, totalCount } = useMemo(() => {
    const total = expenses.reduce(
      (sum, exp) => sum + parseFloat(exp.amount),
      0,
    );
    return { totalAmount: total, totalCount: expenses.length };
  }, [expenses]);

  return (
    <div className='space-y-4'>
      {/* Summary bar */}
      <Card>
        <CardContent className='flex flex-wrap items-center justify-between gap-4 py-4'>
          <div className='flex items-center gap-6'>
            <div>
              <p className='text-muted-foreground text-sm'>Total</p>
              <p className='text-2xl font-bold'>
                ${formatAmount(totalAmount.toString())}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Gastos</p>
              <p className='text-2xl font-bold'>{totalCount}</p>
            </div>
          </div>
          {isAdmin && (
            <Button
              onClick={() => {
                setEditingExpense(undefined);
                setFormDialogOpen(true);
              }}
            >
              <Plus className='mr-2 size-4' />
              Nuevo gasto
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className='flex flex-wrap items-end gap-4'>
        <div className='space-y-1'>
          <Label className='text-sm'>Categoria</Label>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className='w-[200px]'>
              <SelectValue placeholder='Todas' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>Todas</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-1'>
          <Label className='text-sm'>Desde</Label>
          <Input
            type='date'
            value={dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className='w-[160px]'
          />
        </div>

        <div className='space-y-1'>
          <Label className='text-sm'>Hasta</Label>
          <Input
            type='date'
            value={dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
            className='w-[160px]'
          />
        </div>
      </div>

      {/* Month groups */}
      {monthGroups.size === 0 ? (
        <div className='text-muted-foreground py-12 text-center'>
          No hay gastos en este periodo. Usa el selector de fechas para ver
          otros meses.
        </div>
      ) : (
        <div className='space-y-4'>
          {Array.from(monthGroups.entries()).map(
            ([monthKey, monthExpenses]) => (
              <ExpenseMonthGroup
                key={monthKey}
                monthKey={monthKey}
                expenses={monthExpenses}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ),
          )}
        </div>
      )}

      {/* Dialogs */}
      <ExpenseFormDialog
        open={formDialogOpen}
        onOpenChange={handleFormClose}
        categories={categories}
        expense={editingExpense}
        onSuccess={handleSuccess}
      />
      <DeleteExpenseDialog
        expense={deletingExpense}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
