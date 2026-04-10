'use client';

import { useState, type ReactElement } from 'react';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Expense } from './types';
import {
  formatMonthLabel,
  formatAmount,
  formatDateDisplay,
  getCategoryColor,
} from './types';

interface ExpenseMonthGroupProps {
  monthKey: string;
  expenses: Expense[];
  canEdit: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseMonthGroup({
  monthKey,
  expenses,
  canEdit,
  onEdit,
  onDelete,
}: ExpenseMonthGroupProps): ReactElement {
  const [isOpen, setIsOpen] = useState(true);

  const subtotal = expenses.reduce(
    (sum, exp) => sum + parseFloat(exp.amount),
    0,
  );

  const colSpan = canEdit ? 5 : 4;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} defaultOpen>
      <CollapsibleTrigger className='hover:bg-muted/50 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors'>
        <ChevronDown
          className={`size-4 shrink-0 transition-transform duration-200 ${
            isOpen ? '' : '-rotate-90'
          }`}
        />
        <span className='font-medium'>{formatMonthLabel(monthKey)}</span>
        <Badge variant='secondary' className='ml-1'>
          {expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'}
        </Badge>
        <span className='text-muted-foreground ml-auto text-sm'>
          ${formatAmount(subtotal.toString())}
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className='text-right'>Monto</TableHead>
                {canEdit && (
                  <TableHead className='w-[100px] text-right'>
                    Acciones
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={colSpan}
                    className='text-muted-foreground h-16 text-center'
                  >
                    No hay gastos en este mes.
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDateDisplay(expense.date)}</TableCell>
                    <TableCell>{expense.concept}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(expense.category.name)}`}
                      >
                        {expense.category.name}
                      </span>
                    </TableCell>
                    <TableCell className='text-right font-medium'>
                      ${formatAmount(expense.amount)}
                    </TableCell>
                    {canEdit && (
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8'
                            onClick={() => onEdit(expense)}
                          >
                            <Pencil className='size-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8'
                            onClick={() => onDelete(expense)}
                          >
                            <Trash2 className='size-4' />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
