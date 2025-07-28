export interface Program {
  id: number;
  program_id?: string;
  title: string;
  subtitle?: string;
  program_type?: 'single' | 'series' | 'season';
  season_number?: number;
  status?: string;
  project_type: 'platto' | 'liberary' | 'unified';
  
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
  
  // システム管理
  assigned_users?: string[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProgramExtended extends Program {
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

export const ProgramStatuses = {
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

export type ProgramStatusType = typeof ProgramStatuses[keyof typeof ProgramStatuses];