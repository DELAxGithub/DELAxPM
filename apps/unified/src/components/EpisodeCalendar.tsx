import React, { useState, useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  addWeeks,
  parse,
  isSameDay,
  addMonths,
  subMonths,
  differenceInWeeks,
  startOfMonth,
  endOfMonth,
  isSameMonth,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ChevronLeft, ChevronRight, X, Plus, Filter } from 'lucide-react';
import { useEpisodes } from '@delaxpm/core';
import { supabase } from '../lib/supabase';
import { TeamEventModal } from './TeamEventModal';
import { TeamEventCard } from './TeamEventCard';
import { TeamEventDetailModal } from './TeamEventDetailModal';
import { CalendarTaskProvider, useCalendarTasks } from '../contexts/CalendarTaskContext';
import { TEAM_EVENT_COLORS, type TeamEventType } from '@delaxpm/core';

interface EpisodeEventProps {
  episode: any;
  type: 'due' | 'recording';
  eventIndex: number;
  onClick: () => void;
}

function EpisodeEvent({ episode, type, eventIndex, onClick }: EpisodeEventProps) {
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
    <Draggable draggableId={`episode-${episode.id}-${type}`} index={eventIndex}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={!snapshot.isDragging ? onClick : undefined}
          className={`w-full px-2 py-1 mb-1 text-left rounded border ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} text-xs font-medium cursor-grab active:cursor-grabbing transition-all ${
            snapshot.isDragging ? 'shadow-lg rotate-1 scale-105 opacity-90' : 'hover:brightness-95'
          }`}
          style={{
            ...provided.draggableProps.style,
            touchAction: 'none',
            userSelect: 'none',
            pointerEvents: 'auto'
          }}
        >
          <div className="flex items-start gap-1 pointer-events-none">
            <span className="flex-shrink-0">{getEventIcon()}</span>
            <div className="min-w-0 flex-1">
              <div className="font-medium">{episode.episode_id || episode.id}</div>
              <div className="text-[10px] leading-tight break-words">
                {episode.title}
              </div>
              <div className="text-[9px] text-gray-500">
                {getEventLabel()}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function WeekView({ 
  startDate,
  episodes,
  tasks,
  filter,
  onShowEventDetail,
  onAddTeamEvent,
  onEditTask
}: {
  startDate: Date;
  episodes: any[];
  tasks: any[];
  filter: string;
  onShowEventDetail: (event: any) => void;
  onAddTeamEvent: (date: Date) => void;
  onEditTask: (task: any) => void;
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
        
        // エピソードイベントのフィルタリング
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

        // タスクのフィルタリング
        const filteredTasks = tasks.filter(task => {
          const taskStart = parse(task.start_date, 'yyyy-MM-dd', new Date());
          const taskEnd = parse(task.end_date, 'yyyy-MM-dd', new Date());
          
          const isInDateRange = date >= taskStart && date <= taskEnd;
          
          if (!isInDateRange) return false;
          
          switch (filter) {
            case 'episodes':
              return !task.is_team_event && dayEvents.length > 0;
            case 'team-events':
              return task.is_team_event;
            case 'tasks':
              return !task.is_team_event;
            case 'all':
            default:
              return true;
          }
        });

        const teamEvents = filteredTasks
          .filter(task => task.is_team_event)
          .sort((a, b) => a.task_type.localeCompare(b.task_type));

        const filteredDayEvents = filter === 'all' || filter === 'episodes' ? dayEvents : [];

        return (
          <Droppable droppableId={dateStr} key={dateStr}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`min-h-[120px] p-2 border-r border-gray-200 relative ${
                  !isSameMonth(date, startDate) ? 'bg-gray-50' : ''
                } ${
                  snapshot.isDraggingOver ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : ''
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
                  {/* チームイベント追加ボタン */}
                  <button
                    onClick={() => onAddTeamEvent(date)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-full"
                    title="チームイベントを追加"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* チームイベント */}
                <div className="space-y-1">
                  {teamEvents.map((event, index) => (
                    <TeamEventCard
                      key={`team-${event.id}`}
                      event={event}
                      eventIndex={index}
                      onClick={() => onEditTask(event)}
                    />
                  ))}
                </div>

                {/* エピソードイベント */}
                <div className="space-y-1">
                  {filteredDayEvents.map((event, index) => (
                    <EpisodeEvent
                      key={`${event.episode.id}-${event.type}`}
                      episode={event.episode}
                      type={event.type}
                      eventIndex={teamEvents.length + index}
                      onClick={() => onShowEventDetail(event)}
                    />
                  ))}
                </div>
                
                {/* ドロップエリアのプレースホルダー */}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        );
      })}
    </div>
  );
}

function CalendarContent({ projectType }: { projectType: 'platto' | 'liberary' }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<{
    episode: any;
    type: 'due' | 'recording';
  } | null>(null);
  const [isTeamEventModalOpen, setIsTeamEventModalOpen] = useState(false);
  const [isTeamEventDetailOpen, setIsTeamEventDetailOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTeamEvent, setSelectedTeamEvent] = useState<any>(null);
  const [filter, setFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const { episodes, loading: episodesLoading, error: episodesError } = useEpisodes(supabase, {
    projectType: projectType,
    sortBy: 'episode_number',
    sortOrder: 'asc'
  });

  const { tasks, loading: tasksLoading, error: tasksError, addTask, updateTask, deleteTask } = useCalendarTasks();

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { locale: ja });
    const endDate = endOfWeek(endOfMonth(addMonths(monthStart, 1)), { locale: ja });
    const weekCount = differenceInWeeks(endDate, startDate) + 1;
    
    return Array.from({ length: weekCount }, (_, i) => 
      addWeeks(startDate, i)
    );
  }, [currentDate]);

  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleAddTeamEvent = (date: Date) => {
    setSelectedDate(date);
    setIsTeamEventModalOpen(true);
  };

  const handleEditTask = (task: any) => {
    if (task.is_team_event) {
      setSelectedTeamEvent(task);
      setIsTeamEventDetailOpen(true);
    }
  };

  const handleTeamEventSubmit = async (eventData: any) => {
    try {
      await addTask(eventData);
    } catch (error) {
      console.error('Error creating team event:', error);
      throw error;
    }
  };

  const handleTeamEventDelete = async (id: string) => {
    try {
      await deleteTask(id);
    } catch (error) {
      console.error('Error deleting team event:', error);
      throw error;
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) {
      return;
    }

    if (
      result.destination.droppableId === result.source.droppableId &&
      result.destination.index === result.source.index
    ) {
      return;
    }

    const targetDate = result.destination.droppableId; // YYYY-MM-DD format
    
    try {
      if (result.draggableId.startsWith('team-event-')) {
        // チームイベントの処理
        const eventId = result.draggableId.replace('team-event-', '');
        const teamEvent = tasks.find(t => t.id === eventId && t.is_team_event);
        
        if (teamEvent) {
          // チームイベントの期間を計算（元の期間の長さを維持）
          const originalStart = parse(teamEvent.start_date, 'yyyy-MM-dd', new Date());
          const originalEnd = parse(teamEvent.end_date, 'yyyy-MM-dd', new Date());
          const duration = Math.max(0, Math.floor((originalEnd.getTime() - originalStart.getTime()) / (1000 * 60 * 60 * 24)));
          
          const newStart = parse(targetDate, 'yyyy-MM-dd', new Date());
          const newEnd = new Date(newStart.getTime() + duration * 24 * 60 * 60 * 1000);
          
          await updateTask(teamEvent.id, {
            start_date: format(newStart, 'yyyy-MM-dd'),
            end_date: format(newEnd, 'yyyy-MM-dd'),
          });
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const loading = episodesLoading || tasksLoading;
  const error = episodesError || tasksError;

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
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <span>💡 カードをドラッグして日付を変更</span>
              <span className="text-[10px] bg-gray-100 px-1 py-0.5 rounded">🖱️ドラッグ可</span>
            </div>
            
            {/* フィルター */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
                  filter !== 'all' ? 'border-green-500 text-green-600 bg-green-50' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter size={14} />
                フィルター
                {filter !== 'all' && <span className="text-[10px] bg-green-200 text-green-800 px-1 rounded">ON</span>}
              </button>
              
              {showFilters && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30 min-w-[140px]">
                  {[
                    { value: 'all', label: 'すべて' },
                    { value: 'episodes', label: 'エピソード関連' },
                    { value: 'team-events', label: 'チームイベント' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilter(option.value);
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                        filter === option.value ? 'text-green-600 font-medium bg-green-50' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
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
                tasks={tasks}
                filter={filter}
                onShowEventDetail={(event) => {
                  setSelectedEvent(event);
                }}
                onAddTeamEvent={handleAddTeamEvent}
                onEditTask={handleEditTask}
              />
            ))}
          </div>
        </DragDropContext>
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
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <div className="text-sm text-gray-600 font-medium">
                  {selectedEvent.episode.episode_id || selectedEvent.episode.id}
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
                  <div className="text-gray-600">
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

      {/* チームイベント作成モーダル */}
      {isTeamEventModalOpen && selectedDate && (
        <TeamEventModal
          isOpen={isTeamEventModalOpen}
          onClose={() => {
            setIsTeamEventModalOpen(false);
            setSelectedDate(null);
          }}
          selectedDate={selectedDate}
          onSubmit={handleTeamEventSubmit}
        />
      )}

      {/* チームイベント詳細モーダル */}
      {isTeamEventDetailOpen && selectedTeamEvent && (
        <TeamEventDetailModal
          isOpen={isTeamEventDetailOpen}
          onClose={() => {
            setIsTeamEventDetailOpen(false);
            setSelectedTeamEvent(null);
          }}
          event={selectedTeamEvent}
          onDelete={handleTeamEventDelete}
        />
      )}
    </div>
  );
}

interface EpisodeCalendarProps {
  projectType: 'platto' | 'liberary';
}

export function EpisodeCalendar({ projectType }: EpisodeCalendarProps) {
  return (
    <CalendarTaskProvider>
      <CalendarContent projectType={projectType} />
    </CalendarTaskProvider>
  );
}