import React from 'react';
import { getProgramStatusColor, getEpisodeStatusColor } from '../utils/statusUtils';

interface StatusBadgeProps {
  status: string;
  type: 'program' | 'episode';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ 
  status, 
  type, 
  className = '', 
  size = 'md' 
}: StatusBadgeProps) {
  const color = type === 'program' 
    ? getProgramStatusColor(status) 
    : getEpisodeStatusColor(status);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium text-white
        ${sizeClasses[size]} ${className}
      `}
      style={{ backgroundColor: color }}
    >
      {status}
    </span>
  );
}

export default StatusBadge;