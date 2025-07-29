import { useState, useEffect, useCallback } from 'react';
import { Episode } from '../types/episode';

export interface UseEpisodesOptions {
  programId?: number;
  projectType?: 'platto' | 'liberary' | 'unified';
  status?: string;
  episodeType?: 'interview' | 'vtr' | 'regular';
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'episode_number' | 'due_date';
  sortOrder?: 'asc' | 'desc';
}

export interface UseEpisodesReturn {
  episodes: Episode[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
  createEpisode: (episode: Partial<Episode>) => Promise<Episode | null>;
  updateEpisode: (id: number, updates: Partial<Episode>) => Promise<Episode | null>;
  deleteEpisode: (id: number) => Promise<boolean>;
  updateEpisodeStatus: (id: number, status: string) => Promise<Episode | null>;
}

export function useEpisodes(
  supabase: any,
  options: UseEpisodesOptions = {}
): UseEpisodesReturn {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const {
    programId,
    projectType,
    status,
    episodeType,
    limit,
    sortBy = 'episode_number',
    sortOrder = 'asc'
  } = options;

  const fetchEpisodes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('episodes')
        .select(`
          *,
          series!inner(
            id,
            title,
            programs!inner(
              id,
              title,
              project_type
            )
          )
        `, { count: 'exact' });

      // プログラムIDフィルター（seriesテーブル経由）
      if (programId) {
        query = query.eq('series.program_id', programId);
      }

      // プロジェクトタイプフィルター（series.programsテーブル経由）
      if (projectType) {
        query = query.eq('series.programs.project_type', projectType);
      }

      // ステータスフィルター
      if (status) {
        query = query.eq('status', status);
      }

      // エピソードタイプフィルター
      if (episodeType) {
        query = query.eq('episode_type', episodeType);
      }

      // ソート
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // 制限
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setEpisodes(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エピソード取得エラー');
      setEpisodes([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [supabase, programId, projectType, status, episodeType, limit, sortBy, sortOrder]);

  const createEpisode = useCallback(async (episode: Partial<Episode>): Promise<Episode | null> => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('episodes')
        .insert([episode])
        .select(`
          *,
          series!inner(
            id,
            title,
            programs!inner(
              id,
              title,
              project_type
            )
          )
        `)
        .single();

      if (error) throw error;

      setEpisodes(prev => [data, ...prev]);
      setTotalCount(prev => prev + 1);
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エピソード作成エラー');
      return null;
    }
  }, [supabase]);

  const updateEpisode = useCallback(async (id: number, updates: Partial<Episode>): Promise<Episode | null> => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('episodes')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          series!inner(
            id,
            title,
            programs!inner(
              id,
              title,
              project_type
            )
          )
        `)
        .single();

      if (error) throw error;

      setEpisodes(prev => prev.map(e => e.id === id ? data : e));
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エピソード更新エラー');
      return null;
    }
  }, [supabase]);

  const updateEpisodeStatus = useCallback(async (id: number, status: string): Promise<Episode | null> => {
    return updateEpisode(id, { status: status });
  }, [updateEpisode]);

  const deleteEpisode = useCallback(async (id: number): Promise<boolean> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('episodes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEpisodes(prev => prev.filter(e => e.id !== id));
      setTotalCount(prev => prev - 1);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エピソード削除エラー');
      return false;
    }
  }, [supabase]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  return {
    episodes,
    loading,
    error,
    totalCount,
    refetch: fetchEpisodes,
    createEpisode,
    updateEpisode,
    deleteEpisode,
    updateEpisodeStatus
  };
}