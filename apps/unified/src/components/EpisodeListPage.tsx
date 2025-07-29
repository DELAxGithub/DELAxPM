import React, { useState, useMemo } from 'react';
import { Plus, Filter, Calendar, User, ArrowUpDown } from 'lucide-react';
import { useEpisodes, useStatusMaster } from '@delaxpm/core';
import { StatusBadge } from '@delaxpm/core';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

type SortField = 'episode_number' | 'title' | 'status' | 'director';
type SortOrder = 'asc' | 'desc';

interface EpisodeListPageProps {
  projectType: 'platto' | 'liberary';
}

export function EpisodeListPage({ projectType }: EpisodeListPageProps) {
  const { episodes, loading, error, refetch } = useEpisodes(supabase, {
    projectType: projectType,
    sortBy: 'episode_number',
    sortOrder: 'asc'
  });
  
  const { statuses: statusMaster } = useStatusMaster(supabase, {
    projectType: projectType
  });
  
  const [sortField, setSortField] = useState<SortField>('episode_number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [directorFilter, setDirectorFilter] = useState<string>('');
  const [episodeTypeFilter, setEpisodeTypeFilter] = useState<string>('');

  // ソート処理
  const sortedEpisodes = useMemo(() => {
    const sorted = [...episodes].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // null値の処理
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      // 比較
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [episodes, sortField, sortOrder]);

  // フィルター処理
  const filteredEpisodes = useMemo(() => {
    return sortedEpisodes.filter(episode => {
      if (statusFilter && episode.status !== statusFilter) return false;
      if (directorFilter && !episode.director?.toLowerCase().includes(directorFilter.toLowerCase())) return false;
      // エピソードタイプフィルター（metadata.episode_typeを想定）
      if (episodeTypeFilter && episode.metadata?.episode_type !== episodeTypeFilter) return false;
      return true;
    });
  }, [sortedEpisodes, statusFilter, directorFilter, episodeTypeFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">エピソードを読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        エラー: {error}
      </div>
    );
  }

  const projectLabel = projectType === 'platto' ? 'プラット' : 'リベラリー';
  const themeColor = projectType === 'platto' ? 'blue' : 'green';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">エピソード管理</h1>
          <p className="text-gray-600 mt-1">{projectType === 'liberary' ? 'LIBRARY番組のエピソード制作進捗' : 'プラット進捗すごろく'}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${
              (statusFilter || directorFilter || episodeTypeFilter) 
                ? projectType === 'platto' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-green-500 text-green-600'
                : ''
            }`}
          >
            <Filter className="w-4 h-4" />
            フィルター
          </button>
          <button
            onClick={refetch}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg ${
              projectType === 'platto' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            {projectType === 'liberary' ? '新規エピソード' : '更新'}
          </button>
        </div>
      </div>

      {/* フィルター */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={episodeTypeFilter}
              onChange={(e) => setEpisodeTypeFilter(e.target.value)}
              className={`px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${
                projectType === 'platto' ? 'focus:ring-blue-500' : 'focus:ring-green-500'
              }`}
            >
              <option value="">全タイプ</option>
              <option value="interview">インタビュー</option>
              <option value="vtr">VTR</option>
              <option value="regular">レギュラー</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${
                projectType === 'platto' ? 'focus:ring-blue-500' : 'focus:ring-green-500'
              }`}
            >
              <option value="">全ステータス</option>
              {statusMaster?.map(status => (
                <option key={status.status_key} value={status.status_key}>
                  {status.status_name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="担当者で検索"
              value={directorFilter}
              onChange={(e) => setDirectorFilter(e.target.value)}
              className={`px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${
                projectType === 'platto' ? 'focus:ring-blue-500' : 'focus:ring-green-500'
              }`}
            />
            <button
              onClick={() => {
                setStatusFilter('');
                setDirectorFilter('');
                setEpisodeTypeFilter('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              フィルターをリセット
            </button>
          </div>
        </div>
      )}

      {/* エピソード一覧テーブル */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  onClick={() => handleSort('episode_number')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    {projectType === 'liberary' ? 'エピソードID' : 'エピソード番号'}
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('title')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    タイトル
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                {projectType === 'liberary' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイプ
                  </th>
                )}
                <th 
                  onClick={() => handleSort('status')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    ステータス
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {projectType === 'liberary' ? '納期' : '放送日'}
                </th>
                {projectType === 'platto' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    キャスト
                  </th>
                )}
                <th 
                  onClick={() => handleSort('director')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    担当者
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEpisodes.map((episode) => (
                <tr key={episode.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {projectType === 'liberary' ? episode.id : `#${episode.episode_number}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {episode.title}
                  </td>
                  {projectType === 'liberary' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {episode.metadata?.episode_type === 'interview' ? 'インタビュー' : 
                       episode.metadata?.episode_type === 'vtr' ? 'VTR' : 
                       episode.metadata?.episode_type || 'レギュラー'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={episode.status || ''}
                      type="episode"
                      size="sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(() => {
                      const dateValue = projectType === 'liberary' ? episode.metadata?.due_date : episode.first_air_date;
                      return dateValue ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(dateValue), 'yyyy/MM/dd', { locale: ja })}
                        </div>
                      ) : (
                        '-'
                      );
                    })()}
                  </td>
                  {projectType === 'platto' && (
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {[episode.cast1, episode.cast2].filter(Boolean).join('、') || '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {episode.director ? (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {episode.director}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      className={projectType === 'platto' 
                        ? 'text-blue-600 hover:text-blue-800' 
                        : 'text-green-600 hover:text-green-800'
                      }
                    >
                      {projectType === 'liberary' ? '編集' : '詳細'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredEpisodes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            {episodes.length === 0 ? 'エピソードがありません' : 'フィルター条件に一致するエピソードがありません'}
          </div>
        </div>
      )}
    </div>
  );
}