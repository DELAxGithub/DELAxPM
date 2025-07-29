import { supabase } from './supabase';

export interface CalendarEvent {
  id: string;
  episode_id?: string | null;
  task_type: string;
  start_date: string;
  end_date: string;
  meeting_url?: string | null;
  description?: string | null;
  is_team_event: boolean;
  created_at: string;
  updated_at: string;
  episode?: {
    id: string;
    episode_id?: string;
    title?: string;
  } | null;
}

export interface NewCalendarEvent {
  episode_id?: string | null;
  task_type: string;
  start_date: string;
  end_date: string;
  meeting_url?: string | null;
  description?: string | null;
  is_team_event: boolean;
}

export interface UpdateCalendarEvent {
  episode_id?: string | null;
  task_type?: string;
  start_date?: string;
  end_date?: string;
  meeting_url?: string | null;
  description?: string | null;
  is_team_event?: boolean;
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select(`
      *,
      episode:episodes (
        id,
        episode_id,
        title
      )
    `)
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createCalendarEvent(event: NewCalendarEvent): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert([event])
    .select(`
      *,
      episode:episodes (
        id,
        episode_id,
        title
      )
    `)
    .single();

  if (error) throw error;
  return data as CalendarEvent;
}

export async function updateCalendarEvent(id: string, updates: UpdateCalendarEvent): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      episode:episodes (
        id,
        episode_id,
        title
      )
    `)
    .single();

  if (error) throw error;
  return data as CalendarEvent;
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getNearbyEpisodes(date: string) {
  const { data, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('project_type', 'liberary')
    .order('episode_number', { ascending: true });

  if (error) throw error;

  const episodes = data || [];
  const targetDate = new Date(date);

  // 日付との差分を計算し、放送日の近さでソート
  const sortedEpisodes = episodes.sort((a, b) => {
    const dateA = a.first_air_date ? new Date(a.first_air_date) : new Date('9999-12-31');
    const dateB = b.first_air_date ? new Date(b.first_air_date) : new Date('9999-12-31');
    
    const diffA = Math.abs(dateA.getTime() - targetDate.getTime());
    const diffB = Math.abs(dateB.getTime() - targetDate.getTime());
    
    if (diffA === diffB) {
      // 日付の差が同じ場合は、エピソード番号の降順（新しい順）でソート
      return (b.episode_number || 0) - (a.episode_number || 0);
    }
    
    return diffA - diffB;
  });

  return sortedEpisodes.slice(0, 10); // 上位10件のみ返す
}