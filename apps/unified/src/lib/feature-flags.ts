// 機能フラグの定義
export const FEATURES = {
  dragAndDrop: {
    enabled: false,
    description: 'ドラッグ&ドロップでの並び替え',
    users: 'all', // 'all' | string[] (特定ユーザーのメールアドレス)
  },
  bulkEdit: {
    enabled: false,
    description: '複数項目の一括編集',
    users: ['admin@example.com'],
  },
  aiSuggestions: {
    enabled: true,
    description: 'AI による提案機能',
    users: ['test@example.com', 'admin@example.com'],
  },
  advancedFilters: {
    enabled: true,
    description: '高度なフィルター機能',
    users: 'all',
  },
} as const;

export type FeatureKey = keyof typeof FEATURES;

// 機能が有効かチェック
export function isFeatureEnabled(
  feature: FeatureKey,
  userEmail?: string | null
): boolean {
  const config = FEATURES[feature];
  
  if (!config.enabled) return false;
  
  if (config.users === 'all') return true;
  
  if (!userEmail) return false;
  
  return config.users.includes(userEmail);
}

// 開発環境では全機能を有効化するオプション
export function isFeatureEnabledDev(feature: FeatureKey): boolean {
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_ALL_FEATURES === 'true') {
    return true;
  }
  return isFeatureEnabled(feature);
}