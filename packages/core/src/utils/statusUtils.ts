import { ProgramStatuses, EpisodeStatuses } from '../types';

export const getProgramStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    [ProgramStatuses.CASTING]: '#6B7280',
    [ProgramStatuses.LOCATION_COMPLETE]: '#8B5CF6',
    [ProgramStatuses.VIDEO_EDITING_COMPLETE]: '#6366F1',
    [ProgramStatuses.AUDIO_MIXING_COMPLETE]: '#3B82F6',
    [ProgramStatuses.FIRST_PREVIEW_COMPLETE]: '#06B6D4',
    [ProgramStatuses.STATION_PREVIEW_COMPLETE]: '#10B981',
    [ProgramStatuses.FINAL_PACKAGE_COMPLETE]: '#84CC16',
    [ProgramStatuses.ON_AIR_COMPLETE]: '#EAB308',
    [ProgramStatuses.BILLING_COMPLETE]: '#22C55E'
  };
  return colorMap[status] || '#6B7280';
};

export const getEpisodeStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    [EpisodeStatuses.CASTING]: '#6B7280',
    [EpisodeStatuses.LOCATION_COMPLETE]: '#8B5CF6',
    [EpisodeStatuses.VIDEO_EDITING_COMPLETE]: '#6366F1',
    [EpisodeStatuses.AUDIO_MIXING_COMPLETE]: '#3B82F6',
    [EpisodeStatuses.FIRST_PREVIEW_COMPLETE]: '#06B6D4',
    [EpisodeStatuses.STATION_PREVIEW_COMPLETE]: '#10B981',
    [EpisodeStatuses.FINAL_PACKAGE_COMPLETE]: '#84CC16',
    [EpisodeStatuses.ON_AIR_COMPLETE]: '#EAB308',
    [EpisodeStatuses.BILLING_COMPLETE]: '#22C55E'
  };
  return colorMap[status] || '#6B7280';
};

export const getStatusProgress = (status: string, type: 'program' | 'episode'): number => {
  if (type === 'program') {
    const statuses = Object.values(ProgramStatuses);
    const index = statuses.indexOf(status as any);
    return index >= 0 ? ((index + 1) / statuses.length) * 100 : 0;
  } else {
    const statuses = Object.values(EpisodeStatuses);
    const index = statuses.indexOf(status as any);
    return index >= 0 ? ((index + 1) / statuses.length) * 100 : 0;
  }
};

export const getNextStatus = (currentStatus: string, type: 'program' | 'episode'): string | null => {
  if (type === 'program') {
    const statuses = Object.values(ProgramStatuses);
    const currentIndex = statuses.indexOf(currentStatus as any);
    return currentIndex >= 0 && currentIndex < statuses.length - 1 
      ? statuses[currentIndex + 1] 
      : null;
  } else {
    const statuses = Object.values(EpisodeStatuses);
    const currentIndex = statuses.indexOf(currentStatus as any);
    return currentIndex >= 0 && currentIndex < statuses.length - 1 
      ? statuses[currentIndex + 1] 
      : null;
  }
};

export const getPreviousStatus = (currentStatus: string, type: 'program' | 'episode'): string | null => {
  if (type === 'program') {
    const statuses = Object.values(ProgramStatuses);
    const currentIndex = statuses.indexOf(currentStatus as any);
    return currentIndex > 0 ? statuses[currentIndex - 1] : null;
  } else {
    const statuses = Object.values(EpisodeStatuses);
    const currentIndex = statuses.indexOf(currentStatus as any);
    return currentIndex > 0 ? statuses[currentIndex - 1] : null;
  }
};