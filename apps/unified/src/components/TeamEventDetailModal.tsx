import React, { useState } from 'react';
import { X, Calendar, Clock, Globe, Users, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { TEAM_EVENT_COLORS, type TeamEventType } from '@delaxpm/core';

interface TeamEvent {
  id: string;
  task_type: string;
  start_date: string;
  end_date: string;
  meeting_url?: string | null;
  description?: string | null;
  is_team_event: boolean;
  created_at: string;
  updated_at: string;
}

interface TeamEventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TeamEvent;
  onDelete: (id: string) => Promise<void>;
}

export function TeamEventDetailModal({ isOpen, onClose, event, onDelete }: TeamEventDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const eventColor = TEAM_EVENT_COLORS[event.task_type as TeamEventType];
  const eventIcon = getEventIcon(event.task_type as TeamEventType);

  const handleDelete = async () => {
    if (!window.confirm('このチームイベントを削除してもよろしいですか？\n\nこの操作は取り消すことができません。')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(event.id);
      onClose();
    } catch (error) {
      console.error('Error deleting team event:', error);
      // エラーハンドリングは親コンポーネントで行う
    } finally {
      setIsDeleting(false);
    }
  };

  const openMeetingUrl = () => {
    if (event.meeting_url) {
      window.open(event.meeting_url, '_blank', 'noopener,noreferrer');
    }
  };

  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const isSingleDay = event.start_date === event.end_date;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-lg">{eventIcon}</span>
            チームイベント詳細
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* イベントカード */}
          <div className="p-4 rounded-lg border-2" style={{
            background: eventColor?.gradient || eventColor?.bg || '#f3f4f6',
            borderColor: eventColor?.border || '#d1d5db'
          }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{eventIcon}</span>
              <div className={`flex-1 ${eventColor?.text || 'text-gray-900'}`}>
                <div className="font-bold text-lg">{event.task_type}</div>
                <div className="text-sm opacity-90">
                  {isSingleDay ? (
                    format(startDate, 'yyyy/M/d(E)', { locale: ja })
                  ) : (
                    `${format(startDate, 'M/d(E)', { locale: ja })} 〜 ${format(endDate, 'M/d(E)', { locale: ja })}`
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 日程詳細 */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} />
              日程
            </div>
            <div className="text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>開始:</span>
                <span className="font-medium">{format(startDate, 'yyyy年M月d日(E)', { locale: ja })}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span>終了:</span>
                <span className="font-medium">{format(endDate, 'yyyy年M月d日(E)', { locale: ja })}</span>
              </div>
              {!isSingleDay && (
                <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-200">
                  <span>期間:</span>
                  <span className="font-medium">
                    {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1}日間
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 会議URL */}
          {event.meeting_url && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-2">
                <Globe size={16} />
                会議URL
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 text-sm text-blue-700 font-mono bg-white px-2 py-1 rounded border truncate">
                  {event.meeting_url}
                </div>
                <button
                  onClick={openMeetingUrl}
                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                  title="会議URLを開く"
                >
                  <ExternalLink size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 説明 */}
          {event.description && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">説明</div>
              <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {event.description}
              </div>
            </div>
          )}

          {/* メタ情報 */}
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <div>作成日時: {format(new Date(event.created_at), 'yyyy/M/d HH:mm')}</div>
            {event.updated_at !== event.created_at && (
              <div>更新日時: {format(new Date(event.updated_at), 'yyyy/M/d HH:mm')}</div>
            )}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                削除中...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                削除
              </>
            )}
          </button>
          
          <div className="flex items-center gap-3">
            {event.meeting_url && (
              <button
                onClick={openMeetingUrl}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <ExternalLink size={16} />
                会議に参加
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
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