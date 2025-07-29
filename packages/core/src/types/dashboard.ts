export interface DashboardWidget {
  id: string;
  widget_type: 'quicklinks' | 'memo' | 'tasks' | 'schedule' | 'members';
  title: string;
  content: any;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuickLink {
  url: string;
  label: string;
  icon?: string;
  category?: 'meeting' | 'repository' | 'documentation' | 'tool' | 'other';
}

export interface QuickLinksContent {
  links: QuickLink[];
}

export interface Memo {
  id: string;
  title: string;
  text: string;
  priority?: 'high' | 'medium' | 'low';
  created_at?: string;
}

export interface MemoContent {
  text?: string; // 後方互換性のため
  memos?: Memo[];
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  category?: 'development' | 'backend' | 'hr' | 'presentation' | 'testing' | 'other';
}

export interface TasksContent {
  tasks: Task[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'candidate' | 'inactive';
  skills: string[];
  email?: string;
  avatar?: string;
}

export interface MembersContent {
  members: TeamMember[];
}

export interface ScheduleContent {
  // スケジュール概要は calendar_tasks から自動取得するため空
}