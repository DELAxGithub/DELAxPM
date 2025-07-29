import { useState, useEffect } from 'react';
import { getDashboardWidgets, updateDashboardWidget } from '../lib/dashboard';
import type { DashboardWidget } from '@delaxpm/core';

export function useDashboard() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWidgets = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard widgets...');
      const data = await getDashboardWidgets();
      console.log('Dashboard widgets data:', data);
      setWidgets(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard widgets:', err);
      console.error('Error details:', err);
      setError('ダッシュボードの読み込みに失敗しました: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateWidget = async (id: string, updates: Partial<DashboardWidget>) => {
    try {
      const updatedWidget = await updateDashboardWidget(id, updates);
      setWidgets(prev => 
        prev.map(widget => 
          widget.id === id ? updatedWidget : widget
        )
      );
    } catch (err) {
      console.error('Error updating widget:', err);
      setError('ウィジェットの更新に失敗しました');
    }
  };

  useEffect(() => {
    fetchWidgets();
  }, []);

  return {
    widgets,
    loading,
    error,
    refreshWidgets: fetchWidgets,
    updateWidget,
  };
}