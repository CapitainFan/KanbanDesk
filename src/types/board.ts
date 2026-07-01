import type { Profile } from './profile'

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