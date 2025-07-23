import { format, parseISO, addDays, startOfWeek, endOfWeek, isAfter, isBefore } from 'date-fns';
import { ja } from 'date-fns/locale';
import { zonedTimeToUtc, utcToZonedTime, format as formatTz } from 'date-fns-tz';

const TIMEZONE = 'Asia/Tokyo';

export const formatDate = (date: string | Date, formatString: string = 'yyyy-MM-dd'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString, { locale: ja });
};

export const formatDateJapanese = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy年MM月dd日', { locale: ja });
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd HH:mm', { locale: ja });
};

export const toJapanTime = (date: string | Date): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return utcToZonedTime(dateObj, TIMEZONE);
};

export const fromJapanTime = (date: Date): Date => {
  return zonedTimeToUtc(date, TIMEZONE);
};

export const isOverdue = (dueDate: string | Date): boolean => {
  const now = new Date();
  const due = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  return isAfter(now, due);
};

export const getWeekRange = (date: Date = new Date()) => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
};

export const getDaysUntilDeadline = (deadline: string | Date): number => {
  const now = new Date();
  const due = typeof deadline === 'string' ? parseISO(deadline) : deadline;
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getUpcomingDeadlines = (items: Array<{ due_date?: string }>, days: number = 7) => {
  const now = new Date();
  const futureDate = addDays(now, days);
  
  return items.filter(item => {
    if (!item.due_date) return false;
    const dueDate = parseISO(item.due_date);
    return isAfter(dueDate, now) && isBefore(dueDate, futureDate);
  });
};