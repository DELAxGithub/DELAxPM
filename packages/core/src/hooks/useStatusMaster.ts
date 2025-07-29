import { useState, useEffect, useCallback } from 'react';

export interface StatusMaster {
  id: number;
  project_type: 'platto' | 'liberary';
  status_key: string;
  status_name: string;
  order_index: number;
  color_code: string;
  description?: string;
  created_at?: string;
}

export interface UseStatusMasterOptions {
  projectType?: 'platto' | 'liberary';
}

export interface UseStatusMasterReturn {
  statuses: StatusMaster[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getStatusesByProject: (projectType: 'platto' | 'liberary') => StatusMaster[];
  getStatusColor: (projectType: 'platto' | 'liberary', statusKey: string) => string;
  getOrderedStatuses: (projectType: 'platto' | 'liberary') => string[];
  getStatusColors: (projectType: 'platto' | 'liberary') => Record<string, string>;
}

export function useStatusMaster(
  supabase: any,
  options: UseStatusMasterOptions = {}
): UseStatusMasterReturn {
  const [statuses, setStatuses] = useState<StatusMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { projectType } = options;

  const fetchStatuses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('status_master')
        .select('*')
        .order('project_type')
        .order('order_index');

      // プロジェクトタイプフィルター
      if (projectType) {
        query = query.eq('project_type', projectType);
      }

      const { data, error } = await query;

      if (error) throw error;

      setStatuses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ステータス取得エラー');
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, projectType]);

  const getStatusesByProject = useCallback((projectType: 'platto' | 'liberary'): StatusMaster[] => {
    return statuses
      .filter(status => status.project_type === projectType)
      .sort((a, b) => a.order_index - b.order_index);
  }, [statuses]);

  const getStatusColor = useCallback((projectType: 'platto' | 'liberary', statusKey: string): string => {
    const status = statuses.find(s => s.project_type === projectType && s.status_key === statusKey);
    return status?.color_code || '#666666';
  }, [statuses]);

  const getOrderedStatuses = useCallback((projectType: 'platto' | 'liberary'): string[] => {
    return getStatusesByProject(projectType).map(status => status.status_name);
  }, [getStatusesByProject]);

  const getStatusColors = useCallback((projectType: 'platto' | 'liberary'): Record<string, string> => {
    const projectStatuses = getStatusesByProject(projectType);
    const colors: Record<string, string> = {};
    
    projectStatuses.forEach(status => {
      colors[status.status_name] = status.color_code;
    });
    
    return colors;
  }, [getStatusesByProject]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  return {
    statuses,
    loading,
    error,
    refetch: fetchStatuses,
    getStatusesByProject,
    getStatusColor,
    getOrderedStatuses,
    getStatusColors
  };
}