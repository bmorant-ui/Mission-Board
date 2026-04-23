import { z } from 'zod'

export const volunteerSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']).default('pending'),
  skills: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional(),
})

export type VolunteerFormValues = z.infer<typeof volunteerSchema>
