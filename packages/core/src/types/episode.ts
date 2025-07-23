export interface Episode {
  id: number;
  episode_id: string;
  program_id: number;
  title: string;
  episode_type: 'interview' | 'vtr' | 'regular';
  season: number;
  episode_number: number;
  project_type: 'platto' | 'liberary' | 'unified';
  
  // 制作情報
  script_url?: string;
  current_status?: string;
  director?: string;
  due_date?: string;
  
  // インタビュー用項目
  interview_guest?: string;
  interview_date?: string;
  interview_location?: string;
  
  // VTR用項目
  vtr_location?: string;
  vtr_theme?: string;
  
  // その他
  notes?: string;
  estimated_duration?: string;
  assigned_users?: string[];
  
  // 統合管理情報
  source_system?: string;
  migrated_at?: string;
  legacy_id?: string;
  
  // システム管理
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EpisodeStatus {
  id: number;
  status_name: string;
  status_order: number;
  color_code?: string;
  created_at?: string;
}

export interface StatusHistory {
  id: number;
  episode_id: number;
  old_status?: string;
  new_status: string;
  changed_by?: string;
  changed_at: string;
  notes?: string;
}

export const EpisodeStatuses = {
  SCRIPT_CREATION: '台本作成中',
  MATERIAL_PREPARATION: '素材準備',
  MATERIAL_CONFIRMED: '素材確定',
  EDITING: '編集中',
  PREVIEW_1: '試写1',
  REVISION_1: '修正1',
  AUDIO_MIXING: 'MA中',
  FIRST_DRAFT_COMPLETE: '初稿完成',
  REVISION: '修正中',
  FINAL_DELIVERY: '完パケ納品'
} as const;

export type EpisodeStatusType = typeof EpisodeStatuses[keyof typeof EpisodeStatuses];