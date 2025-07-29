import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ja } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';

interface CalendarEvent {
  id: string;
  start_date: string;
  task_type: string;
  is_team_event?: boolean;
  episode?: {
    id: string;
    program_id: string;
  } | null;
}

export default function ScheduleWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchThisWeekEvents();
  }, []);

  const fetchThisWeekEvents = async () => {
    try {
      setLoading(true);
      
      // 今週の範囲を取得
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

      // calendar_eventsテーブルから今週のイベントを取得
      const { data: calendarEvents, error } = await supabase
        .from('calendar_events')
        .select(`
          id,
          start_date,
          task_type,
          is_team_event,
          episode:episodes(id, program_id)
        `)
        .gte('start_date', weekStart.toISOString())
        .lte('start_date', weekEnd.toISOString())
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching calendar events:', error);
        return;
      }

      setEvents((calendarEvents as unknown as CalendarEvent[]) || []);
    } catch (error) {
      console.error('Error in fetchThisWeekEvents:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-xs text-gray-500 py-2">
        読み込み中...
      </div>
    );
  }

  // 重要度でソート（チームイベントを優先、その後日付順）
  const sortedEvents = events
    .sort((a, b) => {
      // チームイベントを優先
      if (a.is_team_event && !b.is_team_event) return -1;
      if (!a.is_team_event && b.is_team_event) return 1;
      
      // 日付順
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    })
    .slice(0, 5); // 最大5件まで表示

  if (sortedEvents.length === 0) {
    return (
      <div className="text-xs text-gray-500 py-2">
        今週の予定はありません。
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedEvents.map((event) => (
        <div key={event.id} className="flex items-start gap-2 text-xs">
          <div className="mt-0.5">
            {event.is_team_event ? (
              <Calendar size={12} className="text-blue-600" />
            ) : (
              <Clock size={12} className="text-gray-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">
                {format(new Date(event.start_date), 'M/d(E)', { locale: ja })}
              </span>
              {event.is_team_event && (
                <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                  チームイベント
                </span>
              )}
            </div>
            <div className={`font-medium truncate ${
              event.is_team_event ? 'text-blue-700' : 'text-gray-700'
            }`}>
              {event.task_type}
            </div>
            {event.episode && (
              <div className="text-gray-500 text-xs truncate">
                {event.episode.program_id}
              </div>
            )}
          </div>
        </div>
      ))}
      
      {events.length > 5 && (
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
          他 {events.length - 5} 件の予定
        </div>
      )}
    </div>
  );
}