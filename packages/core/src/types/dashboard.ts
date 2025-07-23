export interface DashboardWidget {
  id: string;
  type: 'tasks' | 'schedule' | 'memo' | 'quicklinks' | 'stats';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config?: Record<string, any>;
  visible: boolean;
}

export interface DashboardStats {
  total_programs: number;
  programs_in_progress: number;
  programs_completed: number;
  upcoming_deadlines: number;
  overdue_tasks: number;
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  category?: string;
}

export interface DashboardMemo {
  id: number;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  created_by: string;
  created_at: string;
  updated_at?: string;
}