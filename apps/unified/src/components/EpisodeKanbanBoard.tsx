import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MoreVertical, AlertTriangle, Calendar, User, ChevronDown, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useEpisodes } from '@delaxpm/core';
import { supabase } from '../lib/supabase';

interface EpisodeCardProps {
  episode: any;
  index: number;
  onClick: () => void;
}

interface EpisodeCardPropsExtended extends EpisodeCardProps {
  projectType: 'platto' | 'liberary';
}

function EpisodeCard({ episode, index, onClick, projectType }: EpisodeCardPropsExtended) {
  const today = new Date().toISOString().split('T')[0];
  const dueDate = projectType === 'liberary' ? episode.metadata?.due_date : episode.first_air_date;
  const isOverdue = dueDate && dueDate < today && !episode.status?.includes('完');
  
  return (
    <Draggable draggableId={episode.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2 ${
            snapshot.isDragging ? 'shadow-lg opacity-60 rotate-3 scale-105' : 'hover:shadow-md'
          } ${isOverdue ? 'ring-2 ring-red-200 border-red-300' : ''} transition-all duration-200 cursor-pointer`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-600 font-medium truncate">
                  {projectType === 'liberary' ? episode.id : `#${episode.episode_number}`}
                </div>
                {isOverdue && (
                  <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-900 truncate mt-0.5">
                {episode.title}
              </h3>
              
              {/* エピソード固有の情報 */}
              <div className="flex flex-col gap-1 mt-2 text-xs text-gray-600">
                {projectType === 'liberary' && episode.metadata?.episode_type && (
                  <div className="flex items-center gap-1">
                    <span>🎬</span>
                    <span className="truncate">
                      {episode.metadata.episode_type === 'interview' ? 'インタビュー' : 
                       episode.metadata.episode_type === 'vtr' ? 'VTR' : 'レギュラー'}
                    </span>
                  </div>
                )}
                {projectType === 'platto' && episode.cast1 && (
                  <div className="flex items-center gap-1">
                    <User size={10} />
                    <span className="truncate">{episode.cast1}</span>
                  </div>
                )}
                {episode.director && (
                  <div className="flex items-center gap-1">
                    <span>👤</span>
                    <span className="truncate">{episode.director}</span>
                  </div>
                )}
                {dueDate && (
                  <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                    <Calendar size={10} />
                    <span>
                      {format(new Date(dueDate), 'M/d', { locale: ja })}
                      {isOverdue && ' (期限切れ)'}
                    </span>
                  </div>
                )}
                {projectType === 'platto' && episode.location && (
                  <div className="flex items-center gap-1">
                    <span>📍</span>
                    <span className="truncate">{episode.location}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                className={`text-gray-400 transition-colors ${
                  projectType === 'platto' ? 'hover:text-blue-600' : 'hover:text-green-600'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                <MoreVertical size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

interface EpisodeKanbanBoardProps {
  projectType: 'platto' | 'liberary';
  statuses: string[];
  statusColors: Record<string, string>;
}

export default function EpisodeKanbanBoard({ projectType, statuses, statusColors }: EpisodeKanbanBoardProps) {
  const { episodes, loading, error, updateEpisode } = useEpisodes(supabase, {
    projectType: projectType,
    sortBy: 'episode_number',
    sortOrder: 'asc'
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<any>(null);
  const [directorFilter, setDirectorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredEpisodes = episodes.filter(episode => {
    // 検索クエリフィルター
    const query = searchQuery.toLowerCase();
    if (query && !(
      (episode.title || '').toLowerCase().includes(query) ||
      (episode.episode_number || '').toString().includes(query) ||
      (episode.cast1 || '').toLowerCase().includes(query) ||
      (episode.director || '').toLowerCase().includes(query)
    )) {
      return false;
    }

    // 担当者フィルター
    if (directorFilter && !(episode.director || '').toLowerCase().includes(directorFilter.toLowerCase())) {
      return false;
    }

    // ステータスフィルター
    if (statusFilter && episode.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const episodeId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId;

    try {
      await updateEpisode(episodeId, { status: newStatus });
    } catch (error) {
      console.error('Failed to update episode status:', error);
    }
  };

  const handleCardClick = (episode: any) => {
    setSelectedEpisode(episode);
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

  const themeColor = projectType === 'platto' ? 'blue' : 'green';
  const projectLabel = projectType === 'platto' ? 'プラット' : 'リベラリー';

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            {projectLabel}進捗カンバン
          </h2>
          <div className="text-sm text-gray-600">
            全 {episodes.length} エピソード
          </div>
          {/* フィルター適用中バッジ */}
          {(directorFilter || statusFilter) && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              projectType === 'platto' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              フィルター適用中
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* フィルターボタン */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                (directorFilter || statusFilter) 
                  ? projectType === 'platto'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-green-500 text-green-600'
                  : 'border-gray-200 text-gray-900'
              } hover:bg-gray-50 transition-colors`}
            >
              <Filter className="w-4 h-4" />
              フィルター
            </button>
            
            {/* フィルターパネル */}
            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-900">フィルター</h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* ステータス */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        ステータス
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">全ステータス</option>
                        {statuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>

                    {/* 担当者 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        担当者
                      </label>
                      <input
                        type="text"
                        placeholder="担当者で検索"
                        value={directorFilter}
                        onChange={(e) => setDirectorFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* フィルターリセット */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setDirectorFilter('');
                        setStatusFilter('');
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      フィルターをリセット
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* 検索ボックス */}
          <input
            type="search"
            placeholder="エピソードを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>
      
      {/* 縦型カンバンボード */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-4 md:space-y-6">
          {statuses.map((status, statusIndex) => {
            const statusEpisodes = filteredEpisodes.filter(e => e.status === status);
            const isLastPhase = statusIndex === statuses.length - 1;
            const statusColor = statusColors[status] || '#666666';
            
            return (
              <div key={status} className="relative">
                {/* フェーズヘッダー */}
                <div 
                  className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 p-3 md:p-4 rounded-lg border"
                  style={{
                    background: `linear-gradient(135deg, ${statusColor}15, ${statusColor}05)`,
                    borderColor: `${statusColor}30`
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: statusColor }}
                  />
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                    {status}
                  </h3>
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-medium text-white shadow-sm"
                    style={{ backgroundColor: statusColor }}
                  >
                    {statusEpisodes.length}件
                  </span>
                </div>

                {/* カード表示エリア */}
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 min-h-[120px] p-3 md:p-4 rounded-lg border-2 border-dashed transition-all duration-300 ${
                        snapshot.isDraggingOver 
                          ? 'border-blue-400 bg-blue-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      {statusEpisodes.map((episode, index) => (
                        <EpisodeCard
                          key={episode.id}
                          episode={episode}
                          index={index}
                          onClick={() => handleCardClick(episode)}
                          projectType={projectType}
                        />
                      ))}
                      {provided.placeholder}
                      
                      {/* 空の状態 */}
                      {statusEpisodes.length === 0 && (
                        <div className="col-span-full flex items-center justify-center py-8 text-gray-600">
                          <div className="text-center">
                            <div className="text-4xl mb-2">📋</div>
                            <div className="text-sm">ここにカードをドラッグ</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>

                {/* 進捗矢印（最後のフェーズ以外） */}
                {!isLastPhase && (
                  <div className="flex justify-center my-4">
                    <div className="flex flex-col items-center text-gray-600">
                      <ChevronDown size={24} className="animate-bounce" />
                      <div className="text-xs font-medium mt-1">進捗</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}