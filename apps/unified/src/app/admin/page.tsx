'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Users, Database, GitBranch, RefreshCw } from 'lucide-react';

interface SystemInfo {
  title: string;
  url: string;
  repo?: string;
  stats: {
    users: number;
    items: number;
    itemType: string;
  };
  lastDeploy: string;
  version: string;
  status: 'active' | 'legacy' | 'beta';
}

const systems: SystemInfo[] = [
  {
    title: 'Platto（旧）',
    url: 'https://delaxplatto.com',
    repo: 'platto-repo',
    stats: { users: 5, items: 32, itemType: '番組' },
    lastDeploy: '2024-12-15',
    version: '1.0.0',
    status: 'legacy'
  },
  {
    title: 'Liberary（旧）',
    url: 'https://program-management-pm.netlify.app',
    repo: 'program-management-pm',
    stats: { users: 5, items: 150, itemType: 'エピソード' },
    lastDeploy: '2025-01-10',
    version: '1.2.0',
    status: 'legacy'
  },
  {
    title: '統合版（新）',
    url: 'https://delaxpm.netlify.app',
    repo: 'DELAxPM',
    stats: { users: 10, items: 182, itemType: '全データ' },
    lastDeploy: new Date().toISOString().split('T')[0],
    version: '2.0.0',
    status: 'active'
  }
];

export default function AdminDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // 実際のデータ取得処理をここに追加
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'legacy': return 'bg-yellow-500';
      case 'beta': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">DELA×PM システム管理ダッシュボード</h1>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          更新
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {systems.map((system) => (
          <Card key={system.title} className={system.status === 'active' ? 'ring-2 ring-green-500' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{system.title}</CardTitle>
                <Badge className={getStatusColor(system.status)}>
                  {system.status === 'active' ? '稼働中' : system.status === 'legacy' ? '旧版' : 'ベータ'}
                </Badge>
              </div>
              <CardDescription>{system.url}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    ユーザー
                  </span>
                  <span className="font-semibold">{system.stats.users}人</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Database className="w-4 h-4" />
                    {system.stats.itemType}
                  </span>
                  <span className="font-semibold">{system.stats.items}件</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-4 h-4" />
                    バージョン
                  </span>
                  <span className="font-mono text-sm">{system.version}</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>最終デプロイ</span>
                    <span>{system.lastDeploy}</span>
                  </div>
                </div>
                <a
                  href={system.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  システムを開く
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 移行計画セクション */}
      <Card>
        <CardHeader>
          <CardTitle>移行計画</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-semibold">Phase 1（現在）</span>
              <span className="text-gray-600">DB統合済み、アプリは分散運用</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="font-semibold">Phase 2（1-2ヶ月後）</span>
              <span className="text-gray-600">統合アプリを本番化、旧システムからリダイレクト</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span className="font-semibold">Phase 3（3-6ヶ月後）</span>
              <span className="text-gray-600">旧システム廃止、完全統合</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}