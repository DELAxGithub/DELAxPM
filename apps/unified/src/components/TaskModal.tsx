import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { 
  CalendarEvent, 
  NewCalendarEvent, 
  TASK_TYPE_PRESETS,
  TEAM_EVENT_TYPES 
} from '@delaxpm/core';
import { useEpisodes } from '@delaxpm/core';
import { supabase } from '../lib/supabase';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  event?: CalendarEvent;
  onSubmit: (data: NewCalendarEvent) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function TaskModal({ 
  isOpen, 
  onClose, 
  selectedDate, 
  event, 
  onSubmit,
  onDelete 
}: TaskModalProps) {
  const { episodes } = useEpisodes(supabase, { 
    projectType: 'liberary',
    sortBy: 'episode_number',
    sortOrder: 'asc'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isTeamEvent = event?.is_team_event || false;
  const taskTypes = isTeamEvent ? TEAM_EVENT_TYPES : TASK_TYPE_PRESETS;
  
  const [formData, setFormData] = useState({
    episode_id: event?.episode_id || '',
    task_type: event?.task_type || taskTypes[0],
    start_date: event?.start_date ? event.start_date.split('T')[0] : (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''),
    end_date: event?.end_date ? event.end_date.split('T')[0] : (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''),
    meeting_url: event?.meeting_url || '',
    description: event?.description || '',
    is_team_event: event?.is_team_event || false,
    custom_type: event?.task_type && !(taskTypes as readonly string[]).includes(event.task_type) ? event.task_type : '',
  });

  useEffect(() => {
    if (event) {
      setFormData({
        episode_id: event.episode_id || '',
        task_type: event.task_type || taskTypes[0],
        start_date: event.start_date ? event.start_date.split('T')[0] : '',
        end_date: event.end_date ? event.end_date.split('T')[0] : '',
        meeting_url: event.meeting_url || '',
        description: event.description || '',
        is_team_event: event.is_team_event || false,
        custom_type: event.task_type && !(taskTypes as readonly string[]).includes(event.task_type) ? event.task_type : '',
      });
    }
  }, [event, taskTypes]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const submitData: NewCalendarEvent = {
        episode_id: formData.episode_id || null,
        task_type: formData.task_type === 'custom' ? formData.custom_type : formData.task_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        meeting_url: formData.meeting_url || null,
        description: formData.description || null,
        is_team_event: formData.is_team_event,
      };

      await onSubmit(submitData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : isTeamEvent ? 'イベントの保存に失敗しました' : 'タスクの保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete || !window.confirm(isTeamEvent ? 'このイベントを削除してもよろしいですか？' : 'このタスクを削除してもよろしいですか？')) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onDelete(event.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : isTeamEvent ? 'イベントの削除に失敗しました' : 'タスクの削除に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {event ? (isTeamEvent ? 'イベントを編集' : 'タスクを編集') : (isTeamEvent ? '新規イベント' : '新規タスク')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              イベントタイプ
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="event_type"
                  checked={!formData.is_team_event}
                  onChange={() => setFormData(prev => ({ ...prev, is_team_event: false, task_type: TASK_TYPE_PRESETS[0] }))}
                  className="mr-2"
                />
                通常タスク
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="event_type"
                  checked={formData.is_team_event}
                  onChange={() => setFormData(prev => ({ ...prev, is_team_event: true, task_type: TEAM_EVENT_TYPES[0] }))}
                  className="mr-2"
                />
                チームイベント
              </label>
            </div>
          </div>

          {!formData.is_team_event && (
            <div>
              <label htmlFor="episode_id" className="block text-sm font-medium text-gray-700 mb-1">
                関連エピソード
              </label>
              <select
                id="episode_id"
                value={formData.episode_id}
                onChange={(e) => setFormData(prev => ({ ...prev, episode_id: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">関連付けなし</option>
                {episodes.map(episode => (
                  <option key={episode.id} value={episode.id}>
                    {episode.episode_id || `Episode ${episode.episode_number}`} - {episode.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="task_type" className="block text-sm font-medium text-gray-700 mb-1">
              {formData.is_team_event ? 'イベント種別' : 'タスク種別'}
            </label>
            <select
              id="task_type"
              value={formData.task_type}
              onChange={(e) => setFormData(prev => ({ ...prev, task_type: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {taskTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
              <option value="custom">カスタム</option>
            </select>
          </div>

          {formData.task_type === 'custom' && (
            <div>
              <label htmlFor="custom_type" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.is_team_event ? 'カスタムイベント種別' : 'カスタムタスク種別'}
              </label>
              <input
                type="text"
                id="custom_type"
                value={formData.custom_type}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_type: e.target.value }))}
                required={formData.task_type === 'custom'}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={formData.is_team_event ? 'イベント種別を入力' : 'タスク種別を入力'}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                開始日
              </label>
              <input
                type="date"
                id="start_date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                required
                min={formData.start_date}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="meeting_url" className="block text-sm font-medium text-gray-700 mb-1">
              会議URL（任意）
            </label>
            <input
              type="url"
              id="meeting_url"
              value={formData.meeting_url}
              onChange={(e) => setFormData(prev => ({ ...prev, meeting_url: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://..."
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              説明（任意）
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="詳細な説明を入力してください..."
            />
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
            <div className="flex items-center">
              {event && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} />
                  <span>削除</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '保存中...' : event ? '更新' : '登録'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}