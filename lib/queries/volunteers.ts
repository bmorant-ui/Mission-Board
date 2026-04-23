'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Volunteer, VolunteerAssignment } from '@/types/app'
import type { VolunteerFormValues } from '@/lib/validations/volunteer.schema'

export function useVolunteers() {
  return useQuery({
    queryKey: ['volunteers'],
    queryFn: async (): Promise<Volunteer[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .order('full_name')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useVolunteer(volunteerId: string) {
  return useQuery({
    queryKey: ['volunteers', volunteerId],
    queryFn: async (): Promise<Volunteer | null> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .eq('id', volunteerId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!volunteerId,
  })
}

export function useVolunteerAssignments(volunteerId?: string, projectId?: string) {
  return useQuery({
    queryKey: ['volunteer_assignments', { volunteerId, projectId }],
    queryFn: async (): Promise<VolunteerAssignment[]> => {
      const supabase = createClient()
      let query = supabase
        .from('volunteer_assignments')
        .select('*, volunteer:volunteers(*), project:projects(*)')
      if (volunteerId) query = query.eq('volunteer_id', volunteerId)
      if (projectId) query = query.eq('project_id', projectId)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as VolunteerAssignment[]
    },
    enabled: !!(volunteerId || projectId),
  })
}

export function useCreateVolunteer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: VolunteerFormValues) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('volunteers')
        .insert(values)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] })
    },
  })
}

export function useUpdateVolunteer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Volunteer> & { id: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('volunteers')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] })
      queryClient.invalidateQueries({ queryKey: ['volunteers', data.id] })
    },
  })
}

export function useDeleteVolunteer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('volunteers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] })
    },
  })
}

export function useAssignVolunteer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: {
      volunteer_id: string
      project_id: string
      role_title?: string
      hours_per_week?: number
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('volunteer_assignments')
        .insert(values)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, values) => {
      queryClient.invalidateQueries({ queryKey: ['volunteer_assignments'] })
      queryClient.invalidateQueries({ queryKey: ['volunteers', values.volunteer_id] })
    },
  })
}
