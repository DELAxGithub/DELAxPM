export interface CalendarTask {
  id: number;
  title: string;
  date: string;
  type: 'broadcast' | 'rerun' | 'recording' | 'deadline' | 'meeting' | 'other';
  program_id?: number;
  episode_id?: number;
  description?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  assigned_users?: string[];
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface TeamEvent {
  id: number;
  title: string;
  event_type: 'meeting' | 'deadline' | 'training' | 'other';
  start_date: string;
  end_date?: string;
  description?: string;
  location?: string;
  participants?: string[];
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export const CalendarTaskTypes = {
  BROADCAST: 'broadcast',
  RERUN: 'rerun',
  RECORDING: 'recording',
  DEADLINE: 'deadline',
  MEETING: 'meeting',
  OTHER: 'other'
} as const;

export type CalendarTaskType = typeof CalendarTaskTypes[keyof typeof CalendarTaskTypes];