import React, { useState } from 'react';
import { Edit3, Save, X, Plus, AlertTriangle, Clock, Users } from 'lucide-react';
import type { MemoContent, Memo } from '@delaxpm/core';

interface MemoWidgetProps {
  content: MemoContent;
  onUpdate: (content: MemoContent) => void;
}

export default function MemoWidget({ content, onUpdate }: MemoWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content.text || '');
  
  // 新しい複数メモシステム
  const [editMemos, setEditMemos] = useState<Memo[]>(() => {
    if (content.memos) {
      return content.memos;
    }
    // 既存の単一メモを複数メモ形式に変換
    if (content.text) {
      return [{
        id: 'legacy-memo',
        title: 'チーム共有メモ',
        text: content.text,
        priority: 'medium'
      }];
    }
    return [];
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemo, setNewMemo] = useState<Omit<Memo, 'id'>>({
    title: '',
    text: '',
    priority: 'medium'
  });

  const generateMemoId = () => {
    return `memo-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSave = () => {
    if (editMemos.length === 0) {
      onUpdate({ text: editText });
    } else {
      onUpdate({ memos: editMemos });
    }
    setIsEditing(false);
    setShowAddForm(false);
    resetNewMemo();
  };

  const handleCancel = () => {
    setEditText(content.text || '');
    setEditMemos(() => {
      if (content.memos) {
        return content.memos;
      }
      if (content.text) {
        return [{
          id: 'legacy-memo',
          title: 'チーム共有メモ',
          text: content.text,
          priority: 'medium'
        }];
      }
      return [];
    });
    setIsEditing(false);
    setShowAddForm(false);
    resetNewMemo();
  };

  const resetNewMemo = () => {
    setNewMemo({
      title: '',
      text: '',
      priority: 'medium'
    });
  };

  const addMemo = () => {
    if (newMemo.title.trim() && newMemo.text.trim()) {
      const memo: Memo = {
        id: generateMemoId(),
        ...newMemo,
        title: newMemo.title.trim(),
        text: newMemo.text.trim(),
        created_at: new Date().toISOString()
      };
      setEditMemos([...editMemos, memo]);
      resetNewMemo();
      setShowAddForm(false);
    }
  };

  const removeMemo = (id: string) => {
    setEditMemos(editMemos.filter(memo => memo.id !== id));
  };

  const updateMemo = (id: string, updates: Partial<Memo>) => {
    setEditMemos(editMemos.map(memo => 
      memo.id === id ? { ...memo, ...updates } : memo
    ));
  };

  const getPriorityIcon = (priority: Memo['priority']) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle size={12} className="text-red-600" />;
      case 'medium':
        return <Clock size={12} className="text-yellow-600" />;
      case 'low':
        return <Users size={12} className="text-blue-600" />;
      default:
        return <Clock size={12} className="text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: Memo['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (isEditing) {
    // 複数メモモードまたは従来のテキストモード
    const useMultipleMemos = content.memos !== undefined || editMemos.length > 0;

    if (useMultipleMemos) {
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            {editMemos.map((memo) => (
              <div key={memo.id} className={`p-2 rounded border ${getPriorityColor(memo.priority)}`}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={memo.title}
                      onChange={(e) => updateMemo(memo.id, { title: e.target.value })}
                      placeholder="メモタイトル"
                      className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <select
                      value={memo.priority || 'medium'}
                      onChange={(e) => updateMemo(memo.id, { priority: e.target.value as Memo['priority'] })}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="high">緊急</option>
                      <option value="medium">重要</option>
                      <option value="low">情報</option>
                    </select>
                    <button
                      onClick={() => removeMemo(memo.id)}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors"
                      title="削除"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <textarea
                    value={memo.text}
                    onChange={(e) => updateMemo(memo.id, { text: e.target.value })}
                    className="w-full h-20 text-xs border border-gray-300 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="メモ内容..."
                  />
                </div>
              </div>
            ))}
          </div>

          {showAddForm && (
            <div className="p-2 bg-blue-50 rounded border border-blue-200">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMemo.title}
                    onChange={(e) => setNewMemo({ ...newMemo, title: e.target.value })}
                    placeholder="メモタイトル"
                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <select
                    value={newMemo.priority}
                    onChange={(e) => setNewMemo({ ...newMemo, priority: e.target.value as Memo['priority'] })}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="high">緊急</option>
                    <option value="medium">重要</option>
                    <option value="low">情報</option>
                  </select>
                </div>
                <textarea
                  value={newMemo.text}
                  onChange={(e) => setNewMemo({ ...newMemo, text: e.target.value })}
                  className="w-full h-20 text-xs border border-gray-300 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="メモ内容..."
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={addMemo}
                    disabled={!newMemo.title.trim() || !newMemo.text.trim()}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus size={12} />
                    追加
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      resetNewMemo();
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}

          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            >
              <Plus size={12} />
              メモを追加
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Save size={12} />
              保存
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              <X size={12} />
              キャンセル
            </button>
          </div>
        </div>
      );
    } else {
      // 従来の単一テキストモード
      return (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full h-32 text-xs border border-gray-300 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="チーム共有メモを入力..."
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Save size={12} />
              保存
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              <X size={12} />
              キャンセル
            </button>
          </div>
        </div>
      );
    }
  }

  // 表示モード
  const memos = content.memos || [];
  const hasLegacyText = content.text && !content.memos;

  return (
    <div className="group relative">
      {hasLegacyText ? (
        // 従来の単一テキスト表示
        <div className="text-xs text-gray-600 whitespace-pre-wrap min-h-[60px] leading-relaxed">
          {content.text || 'メモがありません。クリックして編集してください。'}
        </div>
      ) : memos.length === 0 ? (
        // メモなしの状態
        <div className="text-xs text-gray-500 py-2">
          メモがありません。クリックして追加してください。
        </div>
      ) : (
        // 複数メモ表示
        <div className="space-y-2">
          {memos
            .sort((a, b) => {
              // 優先度順でソート（高→中→低）
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              return (priorityOrder[b.priority || 'medium'] || 2) - (priorityOrder[a.priority || 'medium'] || 2);
            })
            .map((memo) => (
              <div key={memo.id} className={`p-2 rounded border text-xs ${getPriorityColor(memo.priority)}`}>
                <div className="flex items-start gap-2">
                  {getPriorityIcon(memo.priority)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs mb-1 truncate">
                      {memo.title}
                    </div>
                    <div className="text-xs whitespace-pre-wrap leading-relaxed opacity-90">
                      {memo.text}
                    </div>
                    {memo.created_at && (
                      <div className="text-xs opacity-60 mt-1">
                        {new Date(memo.created_at).toLocaleDateString('ja-JP', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
      
      <button
        onClick={() => setIsEditing(true)}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
        title="編集"
      >
        <Edit3 size={12} />
      </button>
    </div>
  );
}