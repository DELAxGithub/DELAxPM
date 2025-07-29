import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface DashboardWidgetProps {
  title: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  children: React.ReactNode;
}

export default function DashboardWidget({ 
  title, 
  isCollapsed = false, 
  onToggleCollapse,
  children 
}: DashboardWidgetProps) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>{title}</span>
        {onToggleCollapse && (
          isCollapsed ? (
            <ChevronRight size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )
        )}
      </button>
      
      {!isCollapsed && (
        <div className="px-3 pb-3 text-sm">
          {children}
        </div>
      )}
    </div>
  );
}