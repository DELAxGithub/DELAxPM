'use client';

import { usePrograms } from '@delaxpm/core';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner, ErrorMessage, StatusBadge } from '@delaxpm/core';
import Link from 'next/link';

export default function PlattoPage() {
  const { programs, loading, error, refetch } = usePrograms(supabase, {
    projectType: 'platto',
    sortBy: 'updated_at',
    sortOrder: 'desc'
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="プラッと番組データを読み込み中..." />
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
                プラッと進捗すごろく
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {programs.length} 番組
              </span>
              <button
                onClick={refetch}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                更新
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {programs.length === 0 ? (
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
              プラッと進捗すごろくの番組データが見つかりません。
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
            {programs.map((program) => (
              <div
                key={program.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {program.title}
                  </h3>
                  {program.current_status && (
                    <StatusBadge
                      status={program.current_status}
                      type="program"
                      size="sm"
                    />
                  )}
                </div>
                
                {program.subtitle && (
                  <p className="text-sm text-gray-600 mb-3">
                    {program.subtitle}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-500">
                  {program.first_air_date && (
                    <div className="flex items-center">
                      <span className="font-medium">初回放送:</span>
                      <span className="ml-2">{program.first_air_date}</span>
                    </div>
                  )}
                  {program.director && (
                    <div className="flex items-center">
                      <span className="font-medium">演出:</span>
                      <span className="ml-2">{program.director}</span>
                    </div>
                  )}
                  {program.cast1 && (
                    <div className="flex items-center">
                      <span className="font-medium">出演:</span>
                      <span className="ml-2">{program.cast1}</span>
                    </div>
                  )}
                </div>

                {program.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {program.notes}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {program.updated_at && new Date(program.updated_at).toLocaleDateString('ja-JP')}
                  </span>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    詳細を見る
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}