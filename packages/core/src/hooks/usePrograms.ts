import { useState, useEffect, useCallback } from 'react';
import { Episode } from '../types/episode';

export interface UseEpisodesOptions {
  projectType?: 'platto' | 'liberary' | 'unified';
  status?: string;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'title' | 'first_air_date';
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
}

// Backward compatibility aliases (deprecated)
/** @deprecated Use UseEpisodesOptions instead */
export type UseProgramsOptions = UseEpisodesOptions;
/** @deprecated Use UseEpisodesReturn instead - note: programs property is now episodes */
export interface UseProgramsReturn {
  programs: Episode[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
  createProgram: (program: Partial<Episode>) => Promise<Episode | null>;
  updateProgram: (id: number, updates: Partial<Episode>) => Promise<Episode | null>;
  deleteProgram: (id: number) => Promise<boolean>;
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
    projectType,
    status,
    limit,
    sortBy = 'updated_at',
    sortOrder = 'desc'
  } = options;

  const fetchEpisodes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('episodes')
        .select('*', { count: 'exact' });

      // プロジェクトタイプフィルター（notesフィールドのタグでフィルタ）
      if (projectType) {
        if (projectType === 'platto') {
          query = query.ilike('notes', '%[PLATTO]%');
        } else if (projectType === 'liberary') {
          query = query.ilike('notes', '%[LIBERARY]%');
        } else if (projectType !== 'unified') {
          // unified以外の不明なprojectTypeの場合は従来のproject_type列を試す
          query = query.eq('project_type', projectType);
        }
      }

      // ステータスフィルター
      if (status) {
        query = query.eq('status', status);
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
  }, [supabase, projectType, status, limit, sortBy, sortOrder]);

  const createEpisode = useCallback(async (episode: Partial<Episode>): Promise<Episode | null> => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('episodes')
        .insert([episode])
        .select()
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
        .select()
        .single();

      if (error) throw error;

      setEpisodes(prev => prev.map(e => e.id === id ? data : e));
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エピソード更新エラー');
      return null;
    }
  }, [supabase]);

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
    deleteEpisode
  };
}

// Backward compatibility wrapper (deprecated)
/** @deprecated Use useEpisodes instead */
export function usePrograms(
  supabase: any,
  options: UseProgramsOptions = {}
): UseProgramsReturn {
  const result = useEpisodes(supabase, options);
  return {
    programs: result.episodes,
    loading: result.loading,
    error: result.error,
    totalCount: result.totalCount,
    refetch: result.refetch,
    createProgram: result.createEpisode,
    updateProgram: result.updateEpisode,
    deleteProgram: result.deleteEpisode
  };
}