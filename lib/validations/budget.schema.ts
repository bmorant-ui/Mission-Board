import { z } from 'zod'

export const budgetItemSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  budgeted: z.coerce.number().min(0, 'Must be 0 or more'),
  actual: z.coerce.number().min(0, 'Must be 0 or more').default(0),
  notes: z.string().optional(),
  grant_id: z.string().uuid().nullable().optional(),
})

export type BudgetItemFormValues = z.infer<typeof budgetItemSchema>
