import { supabase } from './supabase';

interface Episode {
  id: number;
  episode_id: string;
  title: string;
  episode_type: 'interview' | 'vtr' | 'regular';
  season: number;
  episode_number: number;
  current_status: string;
  director: string;
  due_date?: string;
  interview_guest?: string;
  recording_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CalendarTask {
  id: string;
  task_type: string;
  start_date: string;
  end_date: string;
  description?: string;
  is_team_event?: boolean;
}

interface WeeklyReviewData {
  weeklySchedule: {
    tasks: { date: string; task: CalendarTask }[];
    upcomingDeadlines: { episode: Episode; daysUntil: number }[];
    overdueEpisodes: { episode: Episode; daysOverdue: number }[];
  };
  episodeProgress: {
    totalEpisodes: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    recentUpdates: Episode[];
  };
  weeklyStats: {
    newEpisodes: number;
    completedEpisodes: number;
    inProgressEpisodes: number;
  };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  return new Date(d.setDate(diff));
}

function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function generateWeeklyReview(): Promise<WeeklyReviewData> {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(weekStart);
  const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  console.log(`レビュー期間: ${formatDate(weekStart)} 〜 ${formatDate(weekEnd)}`);

  // 1. 今週のカレンダータスクを取得
  const { data: tasks, error: tasksError } = await supabase
    .from('calendar_tasks')
    .select('*')
    .gte('start_date', formatDate(weekStart))
    .lte('end_date', formatDate(weekEnd))
    .order('start_date');

  if (tasksError) {
    console.error('カレンダータスク取得エラー:', tasksError);
  }

  // 2. 全エピソード情報を取得
  const { data: episodes, error: episodesError } = await supabase
    .from('episodes')
    .select('*')
    .order('updated_at', { ascending: false });

  if (episodesError) {
    console.error('エピソード取得エラー:', episodesError);
  }

  // デフォルト値を設定
  const safeEpisodes = episodes || [];
  const safeTasks = tasks || [];

  console.log(`取得データ: エピソード${safeEpisodes.length}件, タスク${safeTasks.length}件`);

  // 4. 期限分析
  const today = new Date();
  const upcomingDeadlines = safeEpisodes
    .filter(ep => ep.due_date && ep.current_status !== '完パケ納品')
    .map(ep => {
      const dueDate = new Date(ep.due_date!);
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { episode: ep, daysUntil };
    })
    .filter(item => item.daysUntil >= 0 && item.daysUntil <= 14) // 2週間以内
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const overdueEpisodes = safeEpisodes
    .filter(ep => ep.due_date && ep.current_status !== '完パケ納品')
    .map(ep => {
      const dueDate = new Date(ep.due_date!);
      const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return { episode: ep, daysOverdue };
    })
    .filter(item => item.daysOverdue > 0)
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  // 5. ステータス別集計
  const statusCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  
  safeEpisodes.forEach(episode => {
    // ステータス別カウント
    const status = episode.current_status || '未設定';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    
    // タイプ別カウント
    const type = episode.episode_type || 'その他';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  // 6. 最近更新されたエピソード（1週間以内）
  const recentUpdates = safeEpisodes
    .filter(ep => {
      const updatedAt = new Date(ep.updated_at);
      return updatedAt >= lastWeekStart;
    })
    .slice(0, 10); // 最新10件

  // 7. 週次統計
  const newEpisodes = safeEpisodes.filter(ep => {
    const createdAt = new Date(ep.created_at);
    return createdAt >= weekStart && createdAt <= weekEnd;
  }).length;

  const completedEpisodes = safeEpisodes.filter(ep => {
    const updatedAt = new Date(ep.updated_at);
    return ep.current_status === '完パケ納品' && 
           updatedAt >= weekStart && updatedAt <= weekEnd;
  }).length;

  const inProgressEpisodes = safeEpisodes.filter(ep => 
    ep.current_status && 
    ep.current_status !== '完パケ納品' && 
    ep.current_status !== '台本作成中'
  ).length;

  // 8. 週次レビューデータを構築
  const weeklyReviewData: WeeklyReviewData = {
    weeklySchedule: {
      tasks: safeTasks.map(task => ({
        date: task.start_date,
        task: task as CalendarTask,
      })),
      upcomingDeadlines,
      overdueEpisodes,
    },
    episodeProgress: {
      totalEpisodes: safeEpisodes.length,
      byStatus: statusCounts,
      byType: typeCounts,
      recentUpdates,
    },
    weeklyStats: {
      newEpisodes,
      completedEpisodes,
      inProgressEpisodes,
    },
  };

  console.log('週次レビューデータ生成完了');
  return weeklyReviewData;
}

export function formatSlackMessage(data: WeeklyReviewData): any {
  const today = new Date();
  const weekStart = getWeekStart(today);
  const weekEnd = getWeekEnd(weekStart);

  const message = {
    text: "📊 週次エピソード進捗レビュー",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `📊 週次エピソード進捗レビュー`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*期間:* ${weekStart.getMonth() + 1}月${weekStart.getDate()}日〜${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`
        }
      }
    ]
  };

  // 今週の統計
  (message.blocks as any[]).push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*📈 今週の活動*\n` +
            `• 新規エピソード: ${data.weeklyStats.newEpisodes}件\n` +
            `• 完成エピソード: ${data.weeklyStats.completedEpisodes}件\n` +
            `• 制作中エピソード: ${data.weeklyStats.inProgressEpisodes}件`
    }
  });

  // エピソード進捗状況
  if (Object.keys(data.episodeProgress.byStatus).length > 0) {
    const statusText = Object.entries(data.episodeProgress.byStatus)
      .sort((a, b) => b[1] - a[1]) // 件数の多い順
      .slice(0, 8) // 上位8件
      .map(([status, count]) => `• ${status}: ${count}件`)
      .join('\n');

    (message.blocks as any[]).push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*📊 エピソード進捗状況* (全${data.episodeProgress.totalEpisodes}件)\n${statusText}`
      }
    });
  }

  // 期限アラート
  if (data.weeklySchedule.overdueEpisodes.length > 0) {
    const overdueText = data.weeklySchedule.overdueEpisodes
      .slice(0, 5)
      .map(item => `• ${item.episode.episode_id} - ${item.episode.title} (${item.daysOverdue}日遅れ)`)
      .join('\n');

    (message.blocks as any[]).push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*🚨 期限超過アラート*\n${overdueText}`
      }
    });
  }

  // 今後の期限
  if (data.weeklySchedule.upcomingDeadlines.length > 0) {
    const deadlineText = data.weeklySchedule.upcomingDeadlines
      .slice(0, 5)
      .map(item => `• ${item.episode.episode_id} - ${item.episode.title} (あと${item.daysUntil}日)`)
      .join('\n');

    (message.blocks as any[]).push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*⏰ 今後の期限 (2週間以内)*\n${deadlineText}`
      }
    });
  }

  return message;
}

export async function sendSlackNotification(message: any): Promise<void> {
  const webhookUrl = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL;
  
  // テストモード: Webhook URLが設定されていない場合はコンソールに出力
  if (!webhookUrl || webhookUrl === 'your_webhook_url_here') {
    console.log('=== Slack通知（テストモード） ===');
    console.log(JSON.stringify(message, null, 2));
    console.log('=== テストモード終了 ===');
    return;
  }
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send Slack notification: ${response.status} ${response.statusText} - ${errorText}`);
  }
}

export async function sendWeeklyReview(): Promise<{ success: boolean; message: string; stats?: any }> {
  try {
    console.log('=== 週次レビュー生成開始 ===');
    
    const reviewData = await generateWeeklyReview();
    const slackMessage = formatSlackMessage(reviewData);
    
    await sendSlackNotification(slackMessage);
    
    console.log('=== 週次レビュー完了 ===');
    
    return {
      success: true,
      message: 'Weekly review completed successfully',
      stats: {
        totalEpisodes: reviewData.episodeProgress.totalEpisodes,
        tasksCount: reviewData.weeklySchedule.tasks.length,
        overdueCount: reviewData.weeklySchedule.overdueEpisodes.length,
        upcomingDeadlines: reviewData.weeklySchedule.upcomingDeadlines.length,
        newEpisodes: reviewData.weeklyStats.newEpisodes,
        completedEpisodes: reviewData.weeklyStats.completedEpisodes,
      },
    };
  } catch (error) {
    console.error('週次レビューエラー:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}