export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type GrantStatus = 'research' | 'drafting' | 'submitted' | 'awarded' | 'rejected' | 'closed'
export type MemberRole = 'admin' | 'manager' | 'member' | 'viewer'
export type VolunteerStatus = 'active' | 'inactive' | 'pending'

export interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  role: MemberRole
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  color: string
  start_date: string | null
  end_date: string | null
  archived: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Column {
  id: string
  project_id: string
  title: string
  position: number
  color: string | null
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  column_id: string
  title: string
  description: string | null
  priority: Priority
  due_date: string | null
  position: number
  assignee_id: string | null
  created_by: string | null
  tags: string[]
  completed_at: string | null
  created_at: string
  updated_at: string
  assignee?: Profile | null
}

export interface TaskComment {
  id: string
  task_id: string
  author_id: string
  body: string
  created_at: string
  updated_at: string
  author?: Profile
}

export interface Grant {
  id: string
  project_id: string | null
  title: string
  funder_name: string
  funder_contact: string | null
  amount_requested: number | null
  amount_awarded: number | null
  status: GrantStatus
  deadline: string | null
  submission_date: string | null
  report_due: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Volunteer {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  status: VolunteerStatus
  skills: string[]
  availability: Record<string, boolean> | null
  notes: string | null
  linked_user_id: string | null
  created_at: string
  updated_at: string
}

export interface VolunteerAssignment {
  id: string
  volunteer_id: string
  project_id: string
  role_title: string | null
  start_date: string | null
  end_date: string | null
  hours_per_week: number | null
  created_at: string
  project?: Project
  volunteer?: Volunteer
}

export interface BudgetItem {
  id: string
  project_id: string
  grant_id: string | null
  category: string
  description: string
  budgeted: number
  actual: number
  notes: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: MemberRole
  joined_at: string
  profile?: Profile
}

// Board shape used by the Kanban UI
export interface BoardData {
  columns: Column[]
  tasks: Record<string, Task[]> // column_id -> ordered tasks
}

// Calendar event shape
export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: 'task' | 'grant_deadline' | 'grant_report'
  resource?: Task | Grant
  color?: string
}
