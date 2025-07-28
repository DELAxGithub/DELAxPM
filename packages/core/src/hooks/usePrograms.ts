import { useState, useEffect, useCallback } from 'react';
import { Program } from '../types/program';

export interface UseProgramsOptions {
  projectType?: 'platto' | 'liberary' | 'unified';
  status?: string;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'title' | 'first_air_date';
  sortOrder?: 'asc' | 'desc';
}

export interface UseProgramsReturn {
  programs: Program[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
  createProgram: (program: Partial<Program>) => Promise<Program | null>;
  updateProgram: (id: number, updates: Partial<Program>) => Promise<Program | null>;
  deleteProgram: (id: number) => Promise<boolean>;
}

export function usePrograms(
  supabase: any,
  options: UseProgramsOptions = {}
): UseProgramsReturn {
  const [programs, setPrograms] = useState<Program[]>([]);
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

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('programs')
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

      setPrograms(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プログラム取得エラー');
      setPrograms([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [supabase, projectType, status, limit, sortBy, sortOrder]);

  const createProgram = useCallback(async (program: Partial<Program>): Promise<Program | null> => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('programs')
        .insert([program])
        .select()
        .single();

      if (error) throw error;

      setPrograms(prev => [data, ...prev]);
      setTotalCount(prev => prev + 1);
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プログラム作成エラー');
      return null;
    }
  }, [supabase]);

  const updateProgram = useCallback(async (id: number, updates: Partial<Program>): Promise<Program | null> => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('programs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPrograms(prev => prev.map(p => p.id === id ? data : p));
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プログラム更新エラー');
      return null;
    }
  }, [supabase]);

  const deleteProgram = useCallback(async (id: number): Promise<boolean> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPrograms(prev => prev.filter(p => p.id !== id));
      setTotalCount(prev => prev - 1);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プログラム削除エラー');
      return false;
    }
  }, [supabase]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  return {
    programs,
    loading,
    error,
    totalCount,
    refetch: fetchPrograms,
    createProgram,
    updateProgram,
    deleteProgram
  };
}