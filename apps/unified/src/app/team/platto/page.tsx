'use client';

import React, { useState } from 'react';
import { useStatusMaster } from '@delaxpm/core';
import { supabase } from '../../../lib/supabase';
import { LoadingSpinner, ErrorMessage } from '@delaxpm/core';
import Link from 'next/link';
import { EpisodeListPage } from '../../../components/EpisodeListPage';
import EpisodeKanbanBoard from '../../../components/EpisodeKanbanBoard';
import { EpisodeCalendar } from '../../../components/EpisodeCalendar';

type TabType = 'list' | 'kanban' | 'calendar';

export default function PlattoTeamPage() {
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const { getOrderedStatuses, getStatusColors, loading: statusLoading, error: statusError } = useStatusMaster(supabase, {
    projectType: 'platto'
  });

  if (statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="プラットチームデータを読み込み中..." />
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage 
          message={statusError} 
          onRetry={() => window.location.reload()}
          className="max-w-md"
        />
      </div>
    );
  }

  const statuses = getOrderedStatuses('platto');
  const statusColors = getStatusColors('platto');

  const tabs = [
    { id: 'list' as TabType, name: '一覧', description: 'テーブル形式で一覧表示' },
    { id: 'kanban' as TabType, name: 'カンバン', description: '進捗状況をカンバン形式で表示' },
    { id: 'calendar' as TabType, name: 'カレンダー', description: 'スケジュールをカレンダー形式で表示' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'list':
        return <EpisodeListPage projectType="platto" />;
      case 'kanban':
        return <EpisodeKanbanBoard projectType="platto" statuses={statuses} statusColors={statusColors} />;
      case 'calendar':
        return <EpisodeCalendar projectType="platto" />;
      default:
        return <EpisodeListPage projectType="platto" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-blue-600 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-blue-200 hover:text-white mr-4">
                ← ホーム
              </Link>
              <h1 className="text-3xl font-bold">
                プラットチーム専用
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-blue-200">
                9段階進捗管理
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* タブナビゲーション */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
        
        {/* ナビゲーションボタン */}
        <div className="mt-12 flex justify-center space-x-4">
          <Link
            href="/platto"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            通常のプラットページ
          </Link>
          <Link
            href="/dashboard"
            className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
          >
            統合ダッシュボード
          </Link>
        </div>
      </main>
    </div>
  );
}