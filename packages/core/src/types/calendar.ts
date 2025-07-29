export interface CalendarEvent {
  id: string;
  episode_id?: string | null;
  start_date: string;
  end_date: string;
  task_type: string;
  meeting_url?: string | null;
  description?: string | null;
  is_team_event?: boolean;
  created_at: string;
  updated_at: string;
  episode?: {
    id: string;
    program_id: string;
    title?: string;
  } | null;
}

export interface NewCalendarEvent {
  episode_id?: string | null;
  start_date: string;
  end_date: string;
  task_type: string;
  meeting_url?: string | null;
  description?: string | null;
  is_team_event?: boolean;
}

export type UpdateCalendarEvent = Partial<NewCalendarEvent>;

// 通常タスクの種別
export const TASK_TYPE_PRESETS = [
  '編集',
  '試写',
  'MA',
  '収録',
  '配信',
] as const;

// チームイベントの種別
export const TEAM_EVENT_TYPES = [
  '🌐 全体会議',
  '💼 制作会議', 
  '🎬 スタジオ収録',
  '⚠️ 重要',
] as const;

export type TaskTypePreset = typeof TASK_TYPE_PRESETS[number];
export type TeamEventType = typeof TEAM_EVENT_TYPES[number];

// 通常タスク種別ごとの色設定
export const TASK_TYPE_COLORS: Record<TaskTypePreset, { bg: string; text: string; border: string }> = {
  '編集': { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
  'MA': { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300' },
  '試写': { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-300' },
  '収録': { bg: 'bg-green-100', text: 'text-green-900', border: 'border-green-300' },
  '配信': { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-300' },
};

export const DEFAULT_TASK_COLOR = { 
  bg: 'bg-gray-100', 
  text: 'text-gray-900', 
  border: 'border-gray-300' 
};

// チームイベント種別ごとの色設定
export const TEAM_EVENT_COLORS: Record<TeamEventType, { 
  bg: string; 
  text: string; 
  border: string; 
  gradient?: string; 
}> = {
  '🌐 全体会議': { 
    bg: 'bg-gradient-to-r from-blue-500 to-blue-600', 
    text: 'text-white', 
    border: 'border-blue-500',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
  },
  '💼 制作会議': { 
    bg: 'bg-gradient-to-r from-green-500 to-green-600', 
    text: 'text-white', 
    border: 'border-green-500',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  '🎬 スタジオ収録': { 
    bg: 'bg-gradient-to-r from-purple-500 to-purple-600', 
    text: 'text-white', 
    border: 'border-purple-500',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
  },
  '⚠️ 重要': { 
    bg: 'bg-gradient-to-r from-red-500 to-red-600', 
    text: 'text-white', 
    border: 'border-red-500',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
  },
};