import React, { useState } from 'react';
import { X, Calendar, Clock, Globe, Users, Video, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { TEAM_EVENT_TYPES, TEAM_EVENT_COLORS, type TeamEventType } from '@delaxpm/core';

interface NewTeamEvent {
  task_type: string;
  start_date: string;
  end_date: string;
  meeting_url?: string | null;
  description?: string | null;
  is_team_event: boolean;
}

interface TeamEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSubmit: (event: NewTeamEvent) => Promise<void>;
}

const URL_REQUIRED_TYPES = ['🌐 全体会議', '💼 制作会議'];

export function TeamEventModal({ isOpen, onClose, selectedDate, onSubmit }: TeamEventModalProps) {
  const [formData, setFormData] = useState({
    task_type: TEAM_EVENT_TYPES[0] as string,
    start_date: format(selectedDate, 'yyyy-MM-dd'),
    end_date: format(selectedDate, 'yyyy-MM-dd'),
    meeting_url: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlError, setUrlError] = useState('');

  if (!isOpen) return null;

  const requiresUrl = URL_REQUIRED_TYPES.includes(formData.task_type as TeamEventType);

  const validateUrl = (url: string): boolean => {
    if (!url) return !requiresUrl;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (requiresUrl && !formData.meeting_url) {
      setUrlError('このイベントタイプには会議URLが必要です');
      return;
    }

    if (formData.meeting_url && !validateUrl(formData.meeting_url)) {
      setUrlError('有効なURL（https://...）を入力してください');
      return;
    }

    setIsSubmitting(true);
    setUrlError('');

    try {
      await onSubmit({
        task_type: formData.task_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        meeting_url: formData.meeting_url || null,
        description: formData.description || null,
        is_team_event: true,
      });
      onClose();
    } catch (error) {
      console.error('Error creating team event:', error);
      // エラーハンドリングは親コンポーネントで行う
    } finally {
      setIsSubmitting(false);
    }
  };

  const eventColor = TEAM_EVENT_COLORS[formData.task_type as TeamEventType];
  const eventIcon = getEventIcon(formData.task_type as TeamEventType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar size={20} />
            新規チームイベント
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* イベントタイプ選択 */}
          <div>
            <label htmlFor="task_type" className="block text-sm font-medium text-gray-700 mb-1">
              イベントタイプ
            </label>
            <select
              id="task_type"
              value={formData.task_type}
              onChange={(e) => setFormData(prev => ({ ...prev, task_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {TEAM_EVENT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* プレビューカード */}
          <div className="p-3 rounded-lg border-2" style={{
            background: eventColor?.gradient || eventColor?.bg || '#f3f4f6',
            borderColor: eventColor?.border || '#d1d5db'
          }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{eventIcon}</span>
              <div className={`flex-1 ${eventColor?.text || 'text-gray-900'}`}>
                <div className="font-bold text-sm">{formData.task_type}</div>
                <div className="text-xs opacity-80">
                  {format(new Date(formData.start_date), 'M月d日(E)', { locale: ja })}
                  {formData.start_date !== formData.end_date && 
                    ` 〜 ${format(new Date(formData.end_date), 'M月d日(E)', { locale: ja })}`
                  }
                </div>
              </div>
            </div>
          </div>

          {/* 日程選択 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                開始日
              </label>
              <input
                type="date"
                id="start_date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                終了日
              </label>
              <input
                type="date"
                id="end_date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                min={formData.start_date}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* 会議URL（必要な場合） */}
          <div>
            <label htmlFor="meeting_url" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Globe size={14} />
              会議URL
              {requiresUrl && <span className="text-red-500 text-xs">*必須</span>}
            </label>
            <input
              type="url"
              id="meeting_url"
              value={formData.meeting_url}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, meeting_url: e.target.value }));
                if (urlError) setUrlError('');
              }}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                urlError ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              required={requiresUrl}
            />
            {urlError && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                {urlError}
              </p>
            )}
            {requiresUrl && !urlError && (
              <p className="text-blue-600 text-xs mt-1">
                このイベントタイプには会議URLが必要です
              </p>
            )}
          </div>

          {/* 説明 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              説明（任意）
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="イベントの詳細情報や注意事項..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* アクションボタン */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  作成中...
                </>
              ) : (
                <>
                  <Calendar size={16} />
                  イベント作成
                </>
              )}
            </button>
          </div>
        </form>
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