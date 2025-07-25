'use client';

import { useState } from 'react';
import { FEATURES, FeatureKey } from '@/lib/feature-flags';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export default function FeaturesPage() {
  const [features, setFeatures] = useState(FEATURES);

  const toggleFeature = (key: FeatureKey) => {
    // 実際の実装では、この変更をDBやAPIに保存する
    console.log(`Toggling feature: ${key}`);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">機能フラグ管理</h1>
      
      <div className="grid gap-4">
        {Object.entries(features).map(([key, config]) => (
          <Card key={key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{key}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={() => toggleFeature(key as FeatureKey)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">対象ユーザー:</span>
                {config.users === 'all' ? (
                  <Badge variant="secondary">全ユーザー</Badge>
                ) : (
                  <div className="flex gap-1 flex-wrap">
                    {config.users.map((email) => (
                      <Badge key={email} variant="outline">{email}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}