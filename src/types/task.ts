import type { Profile } from './profile'

export interface Task {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  assignee_id: string | null;
  position: number;
  created_by: string;
  created_at: string;
  assignee?: Profile | null;
}

export type TaskUpdate = Pick<Task, 'title' | 'description' | 'priority' | 'due_date' | 'assignee_id'>