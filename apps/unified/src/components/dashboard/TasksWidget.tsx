import React, { useState } from 'react';
import { Plus, X, Edit3, Save, Check, Tag, Code, Server, Users, Presentation, TestTube, MoreHorizontal } from 'lucide-react';
import type { TasksContent, Task } from '@delaxpm/core';

interface TasksWidgetProps {
  content: TasksContent;
  onUpdate: (content: TasksContent) => void;
}

export default function TasksWidget({ content, onUpdate }: TasksWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTasks, setEditTasks] = useState<Task[]>(content.tasks || []);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<Task['category']>('other');
  const [showAddForm, setShowAddForm] = useState(false);

  const generateTaskId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const getCategoryIcon = (category: Task['category']) => {
    switch (category) {
      case 'development':
        return <Code size={12} className="text-blue-600" />;
      case 'backend':
        return <Server size={12} className="text-green-600" />;
      case 'hr':
        return <Users size={12} className="text-purple-600" />;
      case 'presentation':
        return <Presentation size={12} className="text-orange-600" />;
      case 'testing':
        return <TestTube size={12} className="text-red-600" />;
      default:
        return <MoreHorizontal size={12} className="text-gray-600" />;
    }
  };

  const getCategoryLabel = (category: Task['category']) => {
    switch (category) {
      case 'development':
        return '開発';
      case 'backend':
        return 'バックエンド';
      case 'hr':
        return '人事';
      case 'presentation':
        return 'プレゼン';
      case 'testing':
        return 'テスト';
      default:
        return 'その他';
    }
  };

  const getCategoryColor = (category: Task['category']) => {
    switch (category) {
      case 'development':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'backend':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'hr':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'presentation':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'testing':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleSave = () => {
    onUpdate({ tasks: editTasks });
    setIsEditing(false);
    setShowAddForm(false);
    setNewTaskText('');
  };

  const handleCancel = () => {
    setEditTasks(content.tasks || []);
    setIsEditing(false);
    setShowAddForm(false);
    setNewTaskText('');
    setNewTaskCategory('other');
  };

  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask: Task = {
        id: generateTaskId(),
        text: newTaskText.trim(),
        completed: false,
        category: newTaskCategory
      };
      setEditTasks([...editTasks, newTask]);
      setNewTaskText('');
      setNewTaskCategory('other');
      setShowAddForm(false);
    }
  };

  const removeTask = (id: string) => {
    setEditTasks(editTasks.filter(task => task.id !== id));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setEditTasks(editTasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
  };

  const toggleTaskCompletion = (id: string) => {
    const tasks = content.tasks || [];
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    onUpdate({ tasks: updatedTasks });
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {editTasks.map((task) => (
            <div key={task.id} className="p-2 bg-gray-50 rounded space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(e) => updateTask(task.id, { completed: e.target.checked })}
                  className="w-3 h-3 text-blue-600 focus:ring-blue-500 focus:ring-1 border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={task.text}
                  onChange={(e) => updateTask(task.id, { text: e.target.value })}
                  className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => removeTask(task.id)}
                  className="p-1 text-red-500 hover:text-red-700 transition-colors"
                  title="削除"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Tag size={12} className="text-gray-400" />
                <select
                  value={task.category || 'other'}
                  onChange={(e) => updateTask(task.id, { category: e.target.value as Task['category'] })}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="development">開発</option>
                  <option value="backend">バックエンド</option>
                  <option value="hr">人事</option>
                  <option value="presentation">プレゼン</option>
                  <option value="testing">テスト</option>
                  <option value="other">その他</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {showAddForm && (
          <div className="p-2 bg-blue-50 rounded space-y-2">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="新しいタスクを入力..."
              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addTask();
                }
              }}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Tag size={12} className="text-gray-400" />
              <select
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value as Task['category'])}
                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="development">開発</option>
                <option value="backend">バックエンド</option>
                <option value="hr">人事</option>
                <option value="presentation">プレゼン</option>
                <option value="testing">テスト</option>
                <option value="other">その他</option>
              </select>
              <button
                onClick={addTask}
                disabled={!newTaskText.trim()}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={12} />
                追加
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewTaskText('');
                  setNewTaskCategory('other');
                }}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
          >
            <Plus size={12} />
            タスクを追加
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
  }

  const tasks = content.tasks || [];

  return (
    <div className="group relative">
      {tasks.length === 0 ? (
        <div className="text-xs text-gray-500 py-2">
          タスクがありません。
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleTaskCompletion(task.id)}
                  className={`w-3 h-3 border rounded flex items-center justify-center transition-colors ${
                    task.completed 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {task.completed && <Check size={10} />}
                </button>
                <span className={`flex-1 ${
                  task.completed ? 'line-through text-gray-500' : 'text-gray-700'
                }`}>
                  {task.text}
                </span>
              </div>
              {task.category && task.category !== 'other' && (
                <div className="flex items-center gap-1 mt-1 ml-5">
                  {getCategoryIcon(task.category)}
                  <span className={`px-1.5 py-0.5 text-xs rounded border ${getCategoryColor(task.category)}`}>
                    {getCategoryLabel(task.category)}
                  </span>
                </div>
              )}
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