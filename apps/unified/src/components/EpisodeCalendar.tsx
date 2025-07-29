import React, { useState, useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  addMonths,
  subMonths,
  isSameDay,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  addWeeks,
  parse,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, User, X } from 'lucide-react';
import { useEpisodes } from '@delaxpm/core';
import { supabase } from '../lib/supabase';

interface EpisodeEventProps {
  episode: any;
  type: 'due' | 'recording';
  onClick: () => void;
}

function EpisodeEvent({ episode, type, onClick }: EpisodeEventProps) {
  const getEventColor = () => {
    switch (type) {
      case 'due':
        return { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200' };
      case 'recording':
        return { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-900', border: 'border-gray-200' };
    }
  };

  const getEventIcon = () => {
    switch (type) {
      case 'due':
        return '📅';
      case 'recording':
        return episode.metadata?.episode_type === 'interview' ? '🎙️' : '📹';
      default:
        return '📅';
    }
  };

  const getEventLabel = () => {
    switch (type) {
      case 'due':
        return '納期';
      case 'recording':
        return '収録';
      default:
        return 'イベント';
    }
  };

  const colorClasses = getEventColor();

  return (
    <button
      onClick={onClick}
      className={`w-full px-2 py-1 mb-1 text-left rounded border ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} text-xs font-medium hover:brightness-95 transition-all`}
    >
      <div className="flex items-start gap-1">
        <span className="flex-shrink-0">{getEventIcon()}</span>
        <div className="min-w-0 flex-1">
          <div className="font-medium">{episode.id}</div>
          <div className="text-[10px] leading-tight break-words">
            {episode.title}
          </div>
          <div className="text-[9px] text-gray-500">
            {getEventLabel()}
          </div>
        </div>
      </div>
    </button>
  );
}

function WeekView({ 
  startDate,
  episodes,
  onEventClick,
  projectType
}: {
  startDate: Date;
  episodes: any[];
  onEventClick: (episode: any, type: 'due' | 'recording') => void;
  projectType: 'platto' | 'liberary';
}) {
  const weekDays = eachDayOfInterval({
    start: startOfWeek(startDate, { locale: ja }),
    end: endOfWeek(startDate, { locale: ja })
  });

  return (
    <div className="grid grid-cols-7 border-b border-gray-200">
      {weekDays.map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const isFirstOfMonth = date.getDate() === 1;
        
        const dayEvents = episodes.flatMap(episode => {
          const events: { episode: any; type: 'due' | 'recording' }[] = [];
          
          // リベラリーの場合は納期を表示
          if (episode.metadata?.due_date && isSameDay(parse(episode.metadata.due_date, 'yyyy-MM-dd', new Date()), date)) {
            events.push({ episode, type: 'due' });
          }
          // 収録日を表示（インタビューエピソードのみ）
          if (episode.metadata?.episode_type === 'interview' && episode.recording_date && 
              isSameDay(parse(episode.recording_date, 'yyyy-MM-dd', new Date()), date)) {
            events.push({ episode, type: 'recording' });
          }
          
          return events;
        });

        return (
          <div
            key={dateStr}
            className={`min-h-[120px] p-2 border-r border-gray-200 relative ${
              !isSameMonth(date, startDate) ? 'bg-gray-50' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <div className={`text-sm font-medium ${
                  isToday(date) ? 'text-white bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center' :
                  date.getDay() === 0 ? 'text-red-500' :
                  date.getDay() === 6 ? 'text-blue-500' :
                  'text-gray-900'
                }`}>
                  {isFirstOfMonth ? (
                    <span className="flex items-center gap-1">
                      {format(date, 'd')}
                      <span className="text-xs text-gray-600">
                        {format(date, 'M月')}
                      </span>
                    </span>
                  ) : (
                    format(date, 'd')
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              {dayEvents.map((event, index) => (
                <EpisodeEvent
                  key={`${event.episode.id}-${event.type}`}
                  episode={event.episode}
                  type={event.type}
                  onClick={() => onEventClick(event.episode, event.type)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface EpisodeCalendarProps {
  projectType: 'platto' | 'liberary';
}

export function EpisodeCalendar({ projectType }: EpisodeCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<{
    episode: any;
    type: 'due' | 'recording';
  } | null>(null);
  
  const { episodes, loading, error } = useEpisodes(supabase, {
    projectType: projectType,
    sortBy: 'episode_number',
    sortOrder: 'asc'
  });

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { locale: ja });
    const endDate = endOfWeek(endOfMonth(addMonths(monthStart, 1)), { locale: ja });
    
    const weeksArray = [];
    let current = startDate;
    
    while (current <= endDate) {
      weeksArray.push(current);
      current = addWeeks(current, 1);
    }
    
    return weeksArray;
  }, [currentDate]);

  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleEventClick = (episode: any, type: 'due' | 'recording') => {
    setSelectedEvent({ episode, type });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-7rem)]">
        <div className="text-gray-900">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-7rem)]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const projectLabel = projectType === 'platto' ? 'プラット' : 'リベラリー';

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <div className="sticky top-0 bg-white z-20 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-green-800">
              エピソードカレンダー
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousMonth}
                className="p-1 hover:bg-green-100 rounded transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-lg font-medium text-green-700">
                {format(currentDate, 'yyyy年 M月', { locale: ja })}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-green-100 rounded transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="sticky top-0 bg-white z-10 grid grid-cols-7 border-b border-gray-200">
            {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
              <div
                key={day}
                className={`py-2 text-center text-sm font-medium ${
                  index === 0 ? 'text-red-500' : 
                  index === 6 ? 'text-blue-500' : 'text-gray-900'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {weeks.map((weekStart, index) => (
            <WeekView
              key={index}
              startDate={weekStart}
              episodes={episodes}
              onEventClick={handleEventClick}
              projectType={projectType}
            />
          ))}
        </div>
      </div>

      {/* イベント詳細モーダル（簡易版） */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  エピソード詳細
                </h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <div className="text-sm text-gray-600 font-medium">
                  {selectedEvent.episode.id}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-1">
                  {selectedEvent.episode.title}
                </h3>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {selectedEvent.type === 'due' ? '納期' : '収録日'}
                </div>
                <div className="text-gray-600">
                  {selectedEvent.type === 'due' 
                    ? selectedEvent.episode.metadata?.due_date || '未設定' 
                    : selectedEvent.episode.recording_date || '未設定'
                  }
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  タイプ
                </div>
                <div className="text-gray-600">
                  {selectedEvent.episode.metadata?.episode_type === 'interview' ? 'インタビュー' : 
                   selectedEvent.episode.metadata?.episode_type === 'vtr' ? 'VTR' : 'レギュラー'}
                </div>
              </div>

              {selectedEvent.episode.director && (
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    担当者
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <User className="w-4 h-4" />
                    {selectedEvent.episode.director}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}