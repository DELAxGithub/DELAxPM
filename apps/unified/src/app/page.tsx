'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '@delaxpm/core';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="読み込み中..." />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            DELA×PM ログイン
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Supabase認証を使用してログインしてください
          </p>
          <div className="text-center">
            <Link
              href="/auth/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              ログイン
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            DELA×PM 進捗管理システム
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            プラッと進捗すごろく & リベラリー統合版
          </p>
          <p className="text-sm text-gray-500">
            ようこそ、{user.email} さん
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link
            href="/platto"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition-colors">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                プラッと進捗すごろく
              </h2>
              <p className="text-gray-600 mb-4">
                番組制作の9段階進捗管理システム
              </p>
              <div className="text-sm text-blue-600">
                キャスティング中 → 請求済
              </div>
            </div>
          </Link>

          <Link
            href="/liberary"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 transition-colors">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                リベラリー
              </h2>
              <p className="text-gray-600 mb-4">
                エピソード管理と10段階進捗システム
              </p>
              <div className="text-sm text-green-600">
                台本作成中 → 完パケ納品
              </div>
            </div>
          </Link>
        </div>

        <div className="text-center mt-12">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              統合された機能
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center justify-center p-2 bg-gray-50 rounded">番組管理</div>
              <div className="flex items-center justify-center p-2 bg-gray-50 rounded">エピソード管理</div>
              <div className="flex items-center justify-center p-2 bg-gray-50 rounded">カレンダー</div>
              <div className="flex items-center justify-center p-2 bg-gray-50 rounded">ダッシュボード</div>
              <div className="flex items-center justify-center p-2 bg-gray-50 rounded">進捗追跡</div>
              <div className="flex items-center justify-center p-2 bg-gray-50 rounded">チーム管理</div>
              <div className="flex items-center justify-center p-2 bg-gray-50 rounded">レポート機能</div>
              <div className="flex items-center justify-center p-2 bg-gray-50 rounded">統合DB</div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <Link
                href="/dashboard"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                統合ダッシュボード
              </Link>
              <button
                onClick={() => window.location.href = '/auth/logout'}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}