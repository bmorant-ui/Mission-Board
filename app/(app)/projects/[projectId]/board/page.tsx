import { KanbanBoard } from '@/components/board/KanbanBoard'

export default async function BoardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  return <KanbanBoard projectId={projectId} />
}
