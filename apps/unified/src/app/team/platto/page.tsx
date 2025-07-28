'use client';

import { useEpisodes } from '@delaxpm/core';
import { supabase } from '../../../lib/supabase';
import { LoadingSpinner, ErrorMessage, StatusBadge } from '@delaxpm/core';
import Link from 'next/link';

export default function PlattoTeamPage() {
  const { episodes, loading, error, refetch } = useEpisodes(supabase, {
    projectType: 'platto',
    sortBy: 'updated_at',
    sortOrder: 'desc'
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="プラットチームデータを読み込み中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage 
          message={error} 
          onRetry={refetch}
          className="max-w-md"
        />
      </div>
    );
  }

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
                {episodes.length} 番組
              </span>
              <button
                onClick={refetch}
                className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors"
              >
                更新
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* チーム専用メッセージ */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>プラットチーム専用ページ</strong> - このURLはプラットチームのデータのみ表示します
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {episodes.length === 0 ? (
          <div className="text-center py-12">
            <div className="icon-container w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              番組がありません
            </h3>
            <p className="text-gray-500 mb-6">
              プラットチームの番組データが見つかりません。
            </p>
            <button 
              onClick={refetch}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {episodes.map((episode) => (
              <div
                key={episode.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border-l-4 border-blue-400"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {episode.title}
                  </h3>
                  {episode.status && (
                    <StatusBadge
                      status={episode.status}
                      type="program"
                      size="sm"
                    />
                  )}
                </div>
                
                {episode.subtitle && (
                  <p className="text-sm text-gray-600 mb-3">
                    {episode.subtitle}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-500">
                  {episode.first_air_date && (
                    <div className="flex items-center">
                      <span className="font-medium">初回放送:</span>
                      <span className="ml-2">{episode.first_air_date}</span>
                    </div>
                  )}
                  {episode.director && (
                    <div className="flex items-center">
                      <span className="font-medium">演出:</span>
                      <span className="ml-2">{episode.director}</span>
                    </div>
                  )}
                  {episode.cast1 && (
                    <div className="flex items-center">
                      <span className="font-medium">出演:</span>
                      <span className="ml-2">{episode.cast1}</span>
                    </div>
                  )}
                </div>

                {episode.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {episode.notes}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {episode.updated_at && new Date(episode.updated_at).toLocaleDateString('ja-JP')}
                  </span>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    詳細を見る
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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