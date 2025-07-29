'use client';

import React, { useState } from 'react';
import { Menu, X, Calendar, Film, Layers, User, LogOut } from 'lucide-react';
import { EpisodeListPage } from '../../components/EpisodeListPage';
import EpisodeKanbanBoard from '../../components/EpisodeKanbanBoard';
import { EpisodeCalendar } from '../../components/EpisodeCalendar';
import TeamDashboard from '../../components/dashboard/TeamDashboard';
import { useEpisodes, useStatusMaster } from '@delaxpm/core';
import { supabase } from '../../lib/supabase';

type TabType = 'episodes' | 'kanban' | 'calendar';

export default function LiberaryPage() {
  const [activeTab, setActiveTab] = useState<TabType>('episodes');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { episodes, loading, error } = useEpisodes(supabase, {
    projectType: 'liberary',
    sortBy: 'episode_number',
    sortOrder: 'asc'
  });

  const { statuses: statusMaster } = useStatusMaster(supabase, {
    projectType: 'liberary'
  });

  // スタイルカラー設定
  const statusColors = statusMaster?.reduce((acc, status) => {
    acc[status.status_key] = status.color_code || '#10b981';
    return acc;
  }, {} as Record<string, string>) || {};

  const renderContent = () => {
    switch (activeTab) {
      case 'episodes':
        return <EpisodeListPage projectType="liberary" />;
      case 'kanban':
        return (
          <EpisodeKanbanBoard
            projectType="liberary"
            statuses={statusMaster?.map(s => s.status_key) || []}
            statusColors={statusColors}
          />
        );
      case 'calendar':
        return <EpisodeCalendar projectType="liberary" />;
      default:
        return <EpisodeListPage projectType="liberary" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* オーバーレイ（モバイル時のみ表示） */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* サイドバー */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-30
          transition-transform duration-300 ease-in-out
          w-64 flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-600">進捗すごろく</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="mt-6 flex flex-col gap-1 px-3">
          <button
            onClick={() => {
              setActiveTab('calendar');
              setIsSidebarOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-green-50 transition-colors ${
              activeTab === 'calendar' ? 'bg-green-100 text-green-600 font-medium' : ''
            }`}
          >
            <Calendar size={20} />
            <span>カレンダー</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('episodes');
              setIsSidebarOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-green-50 transition-colors ${
              activeTab === 'episodes' ? 'bg-green-100 text-green-600 font-medium' : ''
            }`}
          >
            <Film size={20} />
            <span>エピソード一覧</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('kanban');
              setIsSidebarOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-green-50 transition-colors ${
              activeTab === 'kanban' ? 'bg-green-100 text-green-600 font-medium' : ''
            }`}
          >
            <Layers size={20} />
            <span>進捗すごろく</span>
          </button>
        </nav>

        {/* エピソード統計 */}
        <div className="px-3 mt-6">
          <div className="bg-green-50 rounded-lg p-3">
            <h3 className="text-sm font-medium text-green-800 mb-2">
              エピソード統計
            </h3>
            <div className="space-y-2 text-sm text-green-700">
              <div className="flex justify-between">
                <span>総エピソード数:</span>
                <span className="font-medium">{episodes.length}</span>
              </div>
              {loading && (
                <div className="text-xs text-green-600">
                  読み込み中...
                </div>
              )}
              {error && (
                <div className="text-xs text-red-600">
                  エラー: {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* チームダッシュボード */}
        <TeamDashboard />
      </aside>

      {/* ヘッダー */}
      <header className="h-16 bg-green-600 border-b border-green-700 flex items-center justify-between px-4 md:px-6 fixed top-0 right-0 left-0 md:left-64 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden text-white/80 hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg md:text-xl font-semibold text-white">
            リベラリー進捗すごろく
          </h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2 text-white/80">
            <User size={20} />
            <span className="hidden md:inline">ゲストユーザー</span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="md:ml-64 pt-16">
        <div className="p-4 md:p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}