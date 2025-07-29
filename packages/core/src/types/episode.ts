export interface Episode {
  id: number;
  episode_id?: string;
  title: string;
  subtitle?: string;
  episode_type?: 'regular' | 'special' | 'pilot';
  episode_number?: number;
  season?: number;
  status?: string;
  project_type?: 'platto' | 'liberary' | 'unified';
  
  // 日程関連
  first_air_date?: string;
  re_air_date?: string;
  filming_date?: string;
  complete_date?: string;
  
  // スタッフ・キャスト
  cast1?: string;
  cast2?: string;
  director?: string;
  producer?: string;
  
  // 制作情報
  script_url?: string;
  pr_text?: string;
  notes?: string;
  client_name?: string;
  budget?: number;
  broadcast_time?: string;
  
  // 進捗日程（プラッと用）
  editing_date?: string;
  mixing_date?: string;
  first_preview_date?: string;
  station_preview_date?: string;
  final_package_date?: string;
  on_air_date?: string;
  billing_date?: string;
  
  // PR管理（プラッと用）
  pr_80text?: string;
  pr_200text?: string;
  pr_completed?: boolean;
  pr_due_date?: string;
  
  // 統合管理情報
  source_system?: string;
  migrated_at?: string;
  legacy_id?: string;
  
  // プロジェクト固有データ（JSONB）
  metadata?: {
    episode_type?: 'interview' | 'vtr' | 'regular';
    due_date?: string;
    season?: number;
    [key: string]: any;
  };
  
  // システム管理
  assigned_users?: string[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EpisodeExtended extends Episode {
  director?: string;
  editing_date?: string;
  mixing_date?: string;
  first_preview_date?: string;
  station_preview_date?: string;
  final_package_date?: string;
  on_air_date?: string;
  billing_date?: string;
  broadcast_time?: string;
  client_name?: string;
  budget?: number;
  assigned_users?: string[];
}

export const EpisodeStatuses = {
  CASTING: 'キャスティング中',
  LOCATION_COMPLETE: 'ロケ済',
  VIDEO_EDITING_COMPLETE: 'VE済',
  AUDIO_MIXING_COMPLETE: 'MA済',
  FIRST_PREVIEW_COMPLETE: '初号試写済',
  STATION_PREVIEW_COMPLETE: '局プレ済',
  FINAL_PACKAGE_COMPLETE: '完パケ済',
  ON_AIR_COMPLETE: 'OA済',
  BILLING_COMPLETE: '請求済'
} as const;

export type EpisodeStatusType = typeof EpisodeStatuses[keyof typeof EpisodeStatuses];

// Backward compatibility aliases (deprecated)
/** @deprecated Use Episode instead */
export type Program = Episode;
/** @deprecated Use EpisodeExtended instead */
export type ProgramExtended = EpisodeExtended;
/** @deprecated Use EpisodeStatuses instead */
export const ProgramStatuses = EpisodeStatuses;
/** @deprecated Use EpisodeStatusType instead */
export type ProgramStatusType = EpisodeStatusType;