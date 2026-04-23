import { z } from 'zod'

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().nullable().optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).default([]),
  column_id: z.string().uuid(),
})

export type TaskFormValues = z.infer<typeof taskSchema>
