'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useProjects, useCreateProject } from '@/lib/queries/projects'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { FolderOpen, Plus, Loader2, ArrowRight } from 'lucide-react'
import { PROJECT_COLORS, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects()
  const createProject = useCreateProject()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await createProject.mutateAsync({
        name: name.trim(),
        description: description || undefined,
        color,
        start_date: startDate || null,
        end_date: endDate || null,
      })
      toast.success(`Project "${name}" created!`)
      setOpen(false)
      setName('')
      setDescription('')
      setColor(PROJECT_COLORS[0])
      setStartDate('')
      setEndDate('')
    } catch {
      toast.error('Failed to create project')
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{projects?.length ?? 0} active project{projects?.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {projects?.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first project to start organizing tasks, tracking grants, and managing your team."
          action={
            <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Create first project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.map(project => (
            <Link key={project.id} href={`/projects/${project.id}/board`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {project.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    {project.end_date ? (
                      <span className="text-xs text-gray-400">Due {formatDate(project.end_date)}</span>
                    ) : (
                      <span className="text-xs text-gray-400">No end date</span>
                    )}
                    <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                      Open <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create new project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project name *</Label>
              <Input
                id="project-name"
                placeholder="e.g. Youth Mentorship Program"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-desc">Description</Label>
              <Textarea
                id="project-desc"
                placeholder="What is this project about?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? '#1e1e2e' : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start">Start date</Label>
                <Input id="start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End date</Label>
                <Input id="end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={createProject.isPending}>
                {createProject.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
