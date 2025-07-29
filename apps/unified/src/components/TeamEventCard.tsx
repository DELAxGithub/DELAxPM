import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { TEAM_EVENT_COLORS, type TeamEventType } from '@delaxpm/core';

interface TeamEvent {
  id: string;
  task_type: string;
  start_date: string;
  end_date: string;
  meeting_url?: string | null;
  description?: string | null;
  is_team_event: boolean;
}

interface TeamEventCardProps {
  event: TeamEvent;
  eventIndex: number;
  onClick: () => void;
}

export function TeamEventCard({ event, eventIndex, onClick }: TeamEventCardProps) {
  const eventColor = TEAM_EVENT_COLORS[event.task_type as TeamEventType];

  return (
    <Draggable draggableId={`team-event-${event.id}`} index={eventIndex}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            background: eventColor?.gradient || eventColor?.bg,
            touchAction: 'none',
            userSelect: 'none',
            pointerEvents: 'auto'
          }}
          onClick={!snapshot.isDragging ? onClick : undefined}
          className={`w-full px-3 py-2 mb-2 text-left rounded-lg border-2 text-xs font-bold transition-all cursor-grab active:cursor-grabbing shadow-md ${
            eventColor?.text || 'text-white'
          } ${
            eventColor?.border || 'border-gray-300'
          } ${
            snapshot.isDragging ? 'rotate-2 scale-110 opacity-90 shadow-xl' : 'hover:shadow-lg hover:scale-105'
          }`}
        >
          <div className="flex items-center gap-2 pointer-events-none">
            <span className="text-sm">{getEventIcon(event.task_type as TeamEventType)}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs leading-tight break-words">
                {event.task_type}
              </div>
              {event.meeting_url && (
                <div className="text-[10px] opacity-80 mt-0.5 truncate" title={event.meeting_url}>
                  🔗 会議URL
                </div>
              )}
              {event.description && (
                <div className="text-[10px] opacity-80 mt-0.5 line-clamp-2">
                  {event.description}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function getEventIcon(eventType: TeamEventType): string {
  switch (eventType) {
    case '🌐 全体会議':
      return '🌐';
    case '💼 制作会議':
      return '💼';
    case '🎬 スタジオ収録':
      return '🎬';
    case '⚠️ 重要':
      return '⚠️';
    default:
      return '📅';
  }
}