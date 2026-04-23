import { z } from 'zod'

export const grantSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  funder_name: z.string().min(1, 'Funder name is required'),
  funder_contact: z.string().optional(),
  amount_requested: z.coerce.number().positive().nullable().optional(),
  amount_awarded: z.coerce.number().positive().nullable().optional(),
  status: z.enum(['research', 'drafting', 'submitted', 'awarded', 'rejected', 'closed']),
  deadline: z.string().nullable().optional(),
  submission_date: z.string().nullable().optional(),
  report_due: z.string().nullable().optional(),
  notes: z.string().max(5000).optional(),
  project_id: z.string().uuid().nullable().optional(),
})

export type GrantFormValues = z.infer<typeof grantSchema>
