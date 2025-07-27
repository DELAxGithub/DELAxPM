'use client';

import { useEpisodes } from '@delaxpm/core';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner, ErrorMessage, StatusBadge } from '@delaxpm/core';
import Link from 'next/link';

export default function LiberaryPage() {
  const { episodes, loading, error, refetch } = useEpisodes(supabase, {
    projectType: 'liberary',
    sortBy: 'episode_number',
    sortOrder: 'asc'
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="リベラリーエピソードデータを読み込み中..." />
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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-gray-500 hover:text-gray-700 mr-4">
                ← ホーム
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                リベラリー
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {episodes.length} エピソード
              </span>
              <button
                onClick={refetch}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                更新
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {episodes.length === 0 ? (
          <div className="text-center py-12">
            <div className="icon-container w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              エピソードがありません
            </h3>
            <p className="text-gray-500 mb-6">
              リベラリーのエピソードデータが見つかりません。
            </p>
            <button 
              onClick={refetch}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* エピソードタイプフィルター */}
            <div className="flex space-x-4 mb-6">
              <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md font-medium">
                全て
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                インタビュー
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                VTR
              </button>
            </div>

            {/* エピソードリスト */}
            <div className="grid gap-4">
              {episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {episode.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          #{episode.episode_number}
                        </span>
                        <span className={`
                          px-2 py-1 text-xs rounded-full font-medium
                          ${episode.episode_type === 'interview' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-orange-100 text-orange-700'
                          }
                        `}>
                          {episode.episode_type === 'interview' ? 'インタビュー' : 'VTR'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        エピソードID: {episode.episode_id}
                      </p>
                    </div>
                    {episode.current_status && (
                      <StatusBadge
                        status={episode.current_status}
                        type="episode"
                        size="sm"
                      />
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-500">
                    <div className="space-y-2">
                      {episode.director && (
                        <div className="flex items-center">
                          <span className="font-medium">演出:</span>
                          <span className="ml-2">{episode.director}</span>
                        </div>
                      )}
                      {episode.due_date && (
                        <div className="flex items-center">
                          <span className="font-medium">締切:</span>
                          <span className="ml-2">{episode.due_date}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {episode.episode_type === 'interview' && episode.interview_guest && (
                        <div className="flex items-center">
                          <span className="font-medium">ゲスト:</span>
                          <span className="ml-2">{episode.interview_guest}</span>
                        </div>
                      )}
                      {episode.episode_type === 'vtr' && episode.vtr_theme && (
                        <div className="flex items-center">
                          <span className="font-medium">テーマ:</span>
                          <span className="ml-2">{episode.vtr_theme}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {episode.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {episode.notes}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {episode.updated_at && new Date(episode.updated_at).toLocaleDateString('ja-JP')}
                    </span>
                    <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                      詳細を見る
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}