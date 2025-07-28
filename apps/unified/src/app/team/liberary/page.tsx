'use client';

import { usePrograms } from '@delaxpm/core';
import { supabase } from '../../../lib/supabase';
import { LoadingSpinner, ErrorMessage, StatusBadge } from '@delaxpm/core';
import Link from 'next/link';

export default function LiberaryTeamPage() {
  const { programs, loading, error, refetch } = usePrograms(supabase, {
    projectType: 'liberary',
    sortBy: 'updated_at',
    sortOrder: 'desc'
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="リベラリーチームデータを読み込み中..." />
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
      <header className="bg-green-600 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-green-200 hover:text-white mr-4">
                ← ホーム
              </Link>
              <h1 className="text-3xl font-bold">
                リベラリーチーム専用
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-green-200">
                {programs.length} 番組・エピソード
              </span>
              <button
                onClick={refetch}
                className="bg-white text-green-600 px-4 py-2 rounded-md hover:bg-green-50 transition-colors"
              >
                更新
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* チーム専用メッセージ */}
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>リベラリーチーム専用ページ</strong> - このURLはリベラリーチームのデータのみ表示します
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {programs.length === 0 ? (
          <div className="text-center py-12">
            <div className="icon-container w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              番組がありません
            </h3>
            <p className="text-gray-500 mb-6">
              リベラリーチームの番組データが見つかりません。
            </p>
            <button 
              onClick={refetch}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <div
                key={program.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border-l-4 border-green-400"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {program.title}
                  </h3>
                  {program.status && (
                    <StatusBadge
                      status={program.status}
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
                  <button className="text-green-600 hover:text-green-700 text-sm font-medium">
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
            href="/liberary"
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors"
          >
            通常のリベラリーページ
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