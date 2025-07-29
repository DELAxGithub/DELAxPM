import React, { useState } from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import DashboardWidget from './DashboardWidget';
import MemoWidget from './MemoWidget';
import QuickLinksWidget from './QuickLinksWidget';
import TasksWidget from './TasksWidget';
import ScheduleWidget from './ScheduleWidget';

export default function TeamDashboard() {
  const { widgets, loading, error, updateWidget } = useDashboard();
  const [collapsedWidgets, setCollapsedWidgets] = useState<Record<string, boolean>>({});

  const toggleCollapse = (widgetId: string) => {
    setCollapsedWidgets(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId]
    }));
  };

  if (loading) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-2 text-sm text-red-600">
        {error}
      </div>
    );
  }

  const renderWidgetContent = (widget: any) => {
    switch (widget.widget_type) {
      case 'memo':
        return (
          <MemoWidget 
            content={widget.content} 
            onUpdate={(content) => updateWidget(widget.id, { content })}
          />
        );
      case 'quicklinks':
        return (
          <QuickLinksWidget 
            content={widget.content} 
            onUpdate={(content) => updateWidget(widget.id, { content })}
          />
        );
      case 'tasks':
        return (
          <TasksWidget 
            content={widget.content} 
            onUpdate={(content) => updateWidget(widget.id, { content })}
          />
        );
      case 'schedule':
        return <ScheduleWidget />;
      default:
        return null;
    }
  };

  return (
    <div className="border-t border-gray-200 mt-4">
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        チームダッシュボード
      </div>
      
      {widgets.map((widget) => (
        <DashboardWidget
          key={widget.id}
          title={widget.title}
          isCollapsed={collapsedWidgets[widget.id]}
          onToggleCollapse={() => toggleCollapse(widget.id)}
        >
          {renderWidgetContent(widget)}
        </DashboardWidget>
      ))}
    </div>
  );
}