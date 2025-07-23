'use client';

import { usePrograms, useEpisodes } from '@delaxpm/core';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner, ErrorMessage } from '@delaxpm/core';
import Link from 'next/link';

export default function DashboardPage() {
  const { programs: plattoPrograms, loading: plattoLoading } = usePrograms(supabase, {
    projectType: 'platto'
  });
  
  const { episodes: liberaryEpisodes, loading: liberaryLoading } = useEpisodes(supabase, {
    projectType: 'liberary'
  });

  const loading = plattoLoading || liberaryLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="ダッシュボードデータを読み込み中..." />
      </div>
    );
  }

  const plattoInProgress = plattoPrograms.filter(p => 
    p.current_status && !['OA済', '請求済'].includes(p.current_status)
  ).length;

  const plattoCompleted = plattoPrograms.filter(p => 
    p.current_status && ['OA済', '請求済'].includes(p.current_status)
  ).length;

  const liberaryInProgress = liberaryEpisodes.filter(e => 
    e.current_status && e.current_status !== '完パケ納品'
  ).length;

  const liberaryCompleted = liberaryEpisodes.filter(e => 
    e.current_status === '完パケ納品'
  ).length;

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
                統合ダッシュボード
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">プラッと 進行中</p>
                <p className="text-2xl font-semibold text-blue-900">{plattoInProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">プラッと 完了</p>
                <p className="text-2xl font-semibold text-blue-900">{plattoCompleted}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">リベラリー 進行中</p>
                <p className="text-2xl font-semibold text-green-900">{liberaryInProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">リベラリー 完了</p>
                <p className="text-2xl font-semibold text-green-900">{liberaryCompleted}</p>
              </div>
            </div>
          </div>
        </div>

        {/* プロジェクトサマリー */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                プラッと進捗すごろく
              </h3>
              <Link 
                href="/platto"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                詳細を見る →
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">全体</span>
                <span className="text-sm font-medium">{plattoPrograms.length} 番組</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">進行中</span>
                <span className="text-sm font-medium text-blue-600">{plattoInProgress} 番組</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">完了</span>
                <span className="text-sm font-medium text-green-600">{plattoCompleted} 番組</span>
              </div>
              {plattoPrograms.length > 0 && (
                <div className="pt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(plattoCompleted / plattoPrograms.length) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    完了率: {Math.round((plattoCompleted / plattoPrograms.length) * 100)}%
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                リベラリー
              </h3>
              <Link 
                href="/liberary"
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                詳細を見る →
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">全体</span>
                <span className="text-sm font-medium">{liberaryEpisodes.length} エピソード</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">進行中</span>
                <span className="text-sm font-medium text-green-600">{liberaryInProgress} エピソード</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">完了</span>
                <span className="text-sm font-medium text-blue-600">{liberaryCompleted} エピソード</span>
              </div>
              {liberaryEpisodes.length > 0 && (
                <div className="pt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(liberaryCompleted / liberaryEpisodes.length) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    完了率: {Math.round((liberaryCompleted / liberaryEpisodes.length) * 100)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            クイックアクション
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/platto"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">番組管理</p>
                <p className="text-sm text-gray-500">プラッと進捗すごろく</p>
              </div>
            </Link>

            <Link
              href="/liberary"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">エピソード管理</p>
                <p className="text-sm text-gray-500">リベラリー</p>
              </div>
            </Link>

            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">新規作成</p>
                <p className="text-sm text-gray-500">番組・エピソード</p>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}