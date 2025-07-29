import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface CalendarEvent {
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

interface NewCalendarEvent {
  episode_id?: string | null;
  task_type: string;
  start_date: string;
  end_date: string;
  meeting_url?: string | null;
  description?: string | null;
  is_team_event: boolean;
}

interface UpdateCalendarEvent {
  episode_id?: string | null;
  task_type?: string;
  start_date?: string;
  end_date?: string;
  meeting_url?: string | null;
  description?: string | null;
  is_team_event?: boolean;
}

interface CalendarTaskContextType {
  tasks: CalendarEvent[];
  loading: boolean;
  error: string | null;
  refreshTasks: () => Promise<void>;
  addTask: (task: NewCalendarEvent) => Promise<CalendarEvent>;
  updateTask: (id: string, updates: UpdateCalendarEvent) => Promise<CalendarEvent>;
  deleteTask: (id: string) => Promise<void>;
}

const CalendarTaskContext = createContext<CalendarTaskContextType | undefined>(undefined);

export function CalendarTaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTasks = async () => {
    try {
      setError(null);
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
      setTasks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクデータの取得に失敗しました');
      throw err;
    }
  };

  const addTask = async (task: NewCalendarEvent): Promise<CalendarEvent> => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([task])
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

      const newTask = data as CalendarEvent;
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの作成に失敗しました');
      throw err;
    }
  };

  const updateTask = async (id: string, updates: UpdateCalendarEvent): Promise<CalendarEvent> => {
    try {
      setError(null);
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

      const updatedTask = data as CalendarEvent;
      setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの更新に失敗しました');
      throw err;
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    try {
      setError(null);
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの削除に失敗しました');
      throw err;
    }
  };

  useEffect(() => {
    refreshTasks().finally(() => setLoading(false));

    // リアルタイム更新のサブスクリプション設定
    const channel = supabase
      .channel('calendar_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              // 新しいタスクが追加された場合、詳細情報を取得
              supabase
                .from('calendar_events')
                .select(`
                  *,
                  episode:episodes (
                    id,
                    episode_id,
                    title
                  )
                `)
                .eq('id', payload.new.id)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setTasks(prev => {
                      // 既に存在する場合は追加しない
                      if (prev.some(task => task.id === data.id)) return prev;
                      return [...prev, data as CalendarEvent];
                    });
                  }
                });
              break;
              
            case 'UPDATE':
              // タスクが更新された場合、詳細情報を取得
              supabase
                .from('calendar_events')
                .select(`
                  *,
                  episode:episodes (
                    id,
                    episode_id,
                    title
                  )
                `)
                .eq('id', payload.new.id)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setTasks(prev => prev.map(task => 
                      task.id === data.id ? data as CalendarEvent : task
                    ));
                  }
                });
              break;
              
            case 'DELETE':
              // タスクが削除された場合
              setTasks(prev => prev.filter(task => task.id !== payload.old.id));
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const value: CalendarTaskContextType = {
    tasks,
    loading,
    error,
    refreshTasks,
    addTask,
    updateTask,
    deleteTask,
  };

  return (
    <CalendarTaskContext.Provider value={value}>
      {children}
    </CalendarTaskContext.Provider>
  );
}

export function useCalendarTasks(): CalendarTaskContextType {
  const context = useContext(CalendarTaskContext);
  if (context === undefined) {
    throw new Error('useCalendarTasks must be used within a CalendarTaskProvider');
  }
  return context;
}