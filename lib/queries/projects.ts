'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Project, ProjectMember } from '@/types/app'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: async (): Promise<Project | null> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: async (): Promise<ProjectMember[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('project_members')
        .select('*, profile:profiles(*)')
        .eq('project_id', projectId)
      if (error) throw error
      return (data ?? []) as ProjectMember[]
    },
    enabled: !!projectId,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: {
      name: string
      description?: string
      color: string
      start_date?: string | null
      end_date?: string | null
    }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('projects')
        .insert({ ...values, created_by: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Project> & { id: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', data.id] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
