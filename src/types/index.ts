export interface Class {
  id: string
  name: string
  color: string
  is_archived: boolean
}

export interface Assignment {
  id: string
  title: string
  class_id: string
  due_at: string
  estimated_duration_min: number
  is_important: boolean
  is_urgent: boolean
  status: 'not_started' | 'in_progress' | 'almost_done' | 'completed' | 'overdue'
  notes: string
  progress_pct: number
  created_at: string
  updated_at: string
}

export type ViewType = 'dashboard' | 'list' | 'kanban' | 'calendar' | 'matrix'
export type SmartFilter = 'today' | 'overdue' | 'important' | 'urgent' | 'doNow' | 'quickWins'