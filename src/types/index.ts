// Supabase database types matching our schema

export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

export interface Board {
  id: string;
  title: string;
  owner_id: string;
  created_at: string;
}

export interface BoardMember {
  id: string;
  board_id: string;
  user_id: string;
  role: 'owner' | 'member';
  profile?: Profile;
}

export interface Column {
  id: string;
  board_id: string;
  title: string;
  position: number;
}

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

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export type TaskUpdate = Pick<Task, 'title' | 'description' | 'priority' | 'due_date' | 'assignee_id'>
