'use client';

import { useState } from 'react';

export function WeeklyReviewButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleWeeklyReview = async () => {
    setIsLoading(true);
    setLastResult(null);

    try {
      const response = await fetch('/api/weekly-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setLastResult(`✅ 週報送信完了！ (エピソード${result.stats?.totalEpisodes || 0}件)`);
      } else {
        setLastResult(`❌ エラー: ${result.message}`);
      }
    } catch (error) {
      console.error('週報送信エラー:', error);
      setLastResult(`❌ 送信失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={handleWeeklyReview}
        disabled={isLoading}
        className={`
          px-4 py-2 rounded-md font-medium transition-colors
          ${isLoading 
            ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
            : 'bg-orange-600 text-white hover:bg-orange-700'
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            送信中...
          </span>
        ) : (
          '📊 週報送信'
        )}
      </button>
      
      {lastResult && (
        <div className={`
          text-sm px-3 py-1 rounded max-w-xs text-center
          ${lastResult.startsWith('✅') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
          }
        `}>
          {lastResult}
        </div>
      )}
    </div>
  );
}