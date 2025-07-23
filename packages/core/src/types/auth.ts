export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'producer' | 'director' | 'editor' | 'viewer';
  department?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const UserRoles = {
  ADMIN: 'admin',
  PRODUCER: 'producer',
  DIRECTOR: 'director',
  EDITOR: 'editor',
  VIEWER: 'viewer'
} as const;

export type UserRole = typeof UserRoles[keyof typeof UserRoles];