import React, { useState } from 'react';
import { ExternalLink, Plus, X, Edit3, Save, Github, Calendar, FileText, Wrench, Globe, Users, MessageSquare, Tag } from 'lucide-react';
import type { QuickLinksContent, QuickLink } from '@delaxpm/core';

interface QuickLinksWidgetProps {
  content: QuickLinksContent;
  onUpdate: (content: QuickLinksContent) => void;
}

export default function QuickLinksWidget({ content, onUpdate }: QuickLinksWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLinks, setEditLinks] = useState<QuickLink[]>(content.links || []);
  const [newLink, setNewLink] = useState<QuickLink>({ url: '', label: '', icon: '', category: 'other' });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSave = () => {
    onUpdate({ links: editLinks });
    setIsEditing(false);
    setShowAddForm(false);
    setNewLink({ url: '', label: '' });
  };

  const handleCancel = () => {
    setEditLinks(content.links || []);
    setIsEditing(false);
    setShowAddForm(false);
    setNewLink({ url: '', label: '', icon: '', category: 'other' });
  };

  const addLink = () => {
    if (newLink.url && newLink.label) {
      setEditLinks([...editLinks, newLink]);
      setNewLink({ url: '', label: '', icon: '', category: 'other' });
      setShowAddForm(false);
    }
  };

  const removeLink = (index: number) => {
    setEditLinks(editLinks.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: 'url' | 'label' | 'icon' | 'category', value: string | QuickLink['category']) => {
    setEditLinks(editLinks.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ));
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getCategoryIcon = (category: QuickLink['category']) => {
    switch (category) {
      case 'meeting':
        return <Calendar size={12} className="text-blue-600" />;
      case 'repository':
        return <Github size={12} className="text-gray-700" />;
      case 'documentation':
        return <FileText size={12} className="text-green-600" />;
      case 'tool':
        return <Wrench size={12} className="text-orange-600" />;
      default:
        return <Globe size={12} className="text-gray-500" />;
    }
  };

  const getCategoryLabel = (category: QuickLink['category']) => {
    switch (category) {
      case 'meeting':
        return '会議';
      case 'repository':
        return 'リポジトリ';
      case 'documentation':
        return 'ドキュメント';
      case 'tool':
        return 'ツール';
      default:
        return 'その他';
    }
  };

  const getAutoCategory = (url: string): QuickLink['category'] => {
    const domain = url.toLowerCase();
    if (domain.includes('github.com') || domain.includes('gitlab.com')) return 'repository';
    if (domain.includes('meet.google.com') || domain.includes('zoom.us') || domain.includes('slack.com')) return 'meeting';
    if (domain.includes('notion.so') || domain.includes('confluence') || domain.includes('docs.')) return 'documentation';
    return 'other';
  };

  const getAutoIcon = (url: string): string => {
    const domain = url.toLowerCase();
    if (domain.includes('github.com')) return '📁';
    if (domain.includes('slack.com')) return '🚀';
    if (domain.includes('meet.google.com')) return '📹';
    if (domain.includes('notion.so')) return '📚';
    return '🌐';
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {editLinks.map((link, index) => (
            <div key={index} className="p-2 bg-gray-50 rounded space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateLink(index, 'label', e.target.value)}
                    placeholder="ラベル"
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => {
                      updateLink(index, 'url', e.target.value);
                      // 自動でカテゴリとアイコンを設定
                      if (!link.category || link.category === 'other') {
                        updateLink(index, 'category', getAutoCategory(e.target.value));
                      }
                      if (!link.icon) {
                        updateLink(index, 'icon', getAutoIcon(e.target.value));
                      }
                    }}
                    placeholder="https://..."
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => removeLink(index)}
                  className="p-1 text-red-500 hover:text-red-700 transition-colors"
                  title="削除"
                >
                  <X size={14} />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={link.icon || ''}
                  onChange={(e) => updateLink(index, 'icon', e.target.value)}
                  placeholder="🌐"
                  className="w-8 text-xs border border-gray-300 rounded px-1 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Tag size={12} className="text-gray-400" />
                <select
                  value={link.category || 'other'}
                  onChange={(e) => updateLink(index, 'category', e.target.value as QuickLink['category'])}
                  className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="meeting">会議</option>
                  <option value="repository">リポジトリ</option>
                  <option value="documentation">ドキュメント</option>
                  <option value="tool">ツール</option>
                  <option value="other">その他</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {showAddForm && (
          <div className="p-2 bg-blue-50 rounded space-y-2">
            <div className="space-y-1">
              <input
                type="text"
                value={newLink.label}
                onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                placeholder="ラベル"
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="url"
                value={newLink.url}
                onChange={(e) => {
                  const url = e.target.value;
                  setNewLink({ 
                    ...newLink, 
                    url,
                    category: newLink.category === 'other' ? getAutoCategory(url) : newLink.category,
                    icon: newLink.icon === '' ? getAutoIcon(url) : newLink.icon
                  });
                }}
                placeholder="https://..."
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newLink.icon || ''}
                onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
                placeholder="🌐"
                className="w-8 text-xs border border-gray-300 rounded px-1 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Tag size={12} className="text-gray-400" />
              <select
                value={newLink.category || 'other'}
                onChange={(e) => setNewLink({ ...newLink, category: e.target.value as QuickLink['category'] })}
                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="meeting">会議</option>
                <option value="repository">リポジトリ</option>
                <option value="documentation">ドキュメント</option>
                <option value="tool">ツール</option>
                <option value="other">その他</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={addLink}
                disabled={!newLink.url || !newLink.label || !validateUrl(newLink.url)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={12} />
                追加
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewLink({ url: '', label: '', icon: '', category: 'other' });
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
            リンクを追加
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

  const links = content.links || [];

  return (
    <div className="group relative">
      {links.length === 0 ? (
        <div className="text-xs text-gray-500 py-2">
          クイックリンクがありません。
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link, index) => (
            <div key={index} className="group">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 transition-colors"
              >
                <div className="flex items-center gap-1">
                  {link.icon ? (
                    <span className="text-xs">{link.icon}</span>
                  ) : (
                    getCategoryIcon(link.category)
                  )}
                  <ExternalLink size={10} className="opacity-50" />
                </div>
                <span className="truncate flex-1">{link.label}</span>
              </a>
              {link.category && link.category !== 'other' && (
                <div className="ml-6 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded border">
                    {getCategoryIcon(link.category)}
                    <span className="text-xs">{getCategoryLabel(link.category)}</span>
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