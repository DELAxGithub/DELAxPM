import React, { useState } from 'react';
import { Users, Plus, X, Edit3, Save, Mail, Star, UserCheck, UserX, Code } from 'lucide-react';
import type { MembersContent, TeamMember } from '@delaxpm/core';

interface MembersWidgetProps {
  content: MembersContent;
  onUpdate: (content: MembersContent) => void;
}

export default function MembersWidget({ content, onUpdate }: MembersWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editMembers, setEditMembers] = useState<TeamMember[]>(content.members || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState<Omit<TeamMember, 'id'>>({
    name: '',
    role: '',
    status: 'candidate',
    skills: [],
    email: '',
  });

  const generateMemberId = () => {
    return `member-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSave = () => {
    onUpdate({ members: editMembers });
    setIsEditing(false);
    setShowAddForm(false);
    resetNewMember();
  };

  const handleCancel = () => {
    setEditMembers(content.members || []);
    setIsEditing(false);
    setShowAddForm(false);
    resetNewMember();
  };

  const resetNewMember = () => {
    setNewMember({
      name: '',
      role: '',
      status: 'candidate',
      skills: [],
      email: '',
    });
  };

  const addMember = () => {
    if (newMember.name.trim() && newMember.role.trim()) {
      const member: TeamMember = {
        id: generateMemberId(),
        ...newMember,
        name: newMember.name.trim(),
        role: newMember.role.trim(),
        skills: newMember.skills.filter(skill => skill.trim()),
      };
      setEditMembers([...editMembers, member]);
      resetNewMember();
      setShowAddForm(false);
    }
  };

  const removeMember = (id: string) => {
    setEditMembers(editMembers.filter(member => member.id !== id));
  };

  const updateMember = (id: string, updates: Partial<TeamMember>) => {
    setEditMembers(editMembers.map(member => 
      member.id === id ? { ...member, ...updates } : member
    ));
  };

  const addSkill = (memberId: string, skill: string) => {
    if (skill.trim()) {
      updateMember(memberId, {
        skills: [...(editMembers.find(m => m.id === memberId)?.skills || []), skill.trim()]
      });
    }
  };

  const removeSkill = (memberId: string, skillIndex: number) => {
    const member = editMembers.find(m => m.id === memberId);
    if (member) {
      updateMember(memberId, {
        skills: member.skills.filter((_, index) => index !== skillIndex)
      });
    }
  };

  const getStatusIcon = (status: TeamMember['status']) => {
    switch (status) {
      case 'active':
        return <UserCheck size={12} className="text-green-600" />;
      case 'candidate':
        return <Star size={12} className="text-yellow-600" />;
      case 'inactive':
        return <UserX size={12} className="text-gray-400" />;
      default:
        return <Users size={12} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'candidate':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'inactive':
        return 'bg-gray-50 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {editMembers.map((member) => (
            <div key={member.id} className="p-3 bg-gray-50 rounded-lg border">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => updateMember(member.id, { name: e.target.value })}
                    placeholder="名前"
                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <select
                    value={member.status}
                    onChange={(e) => updateMember(member.id, { status: e.target.value as TeamMember['status'] })}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="active">アクティブ</option>
                    <option value="candidate">候補</option>
                    <option value="inactive">非アクティブ</option>
                  </select>
                  <button
                    onClick={() => removeMember(member.id)}
                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    title="削除"
                  >
                    <X size={14} />
                  </button>
                </div>
                
                <input
                  type="text"
                  value={member.role}
                  onChange={(e) => updateMember(member.id, { role: e.target.value })}
                  placeholder="役割"
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                
                <input
                  type="email"
                  value={member.email || ''}
                  onChange={(e) => updateMember(member.id, { email: e.target.value })}
                  placeholder="メールアドレス (任意)"
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <div className="space-y-1">
                  <div className="text-xs text-gray-600">スキル:</div>
                  <div className="flex flex-wrap gap-1">
                    {member.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(member.id, index)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="スキルを追加..."
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addSkill(member.id, e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showAddForm && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="名前"
                  className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <select
                  value={newMember.status}
                  onChange={(e) => setNewMember({ ...newMember, status: e.target.value as TeamMember['status'] })}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="active">アクティブ</option>
                  <option value="candidate">候補</option>
                  <option value="inactive">非アクティブ</option>
                </select>
              </div>
              
              <input
                type="text"
                value={newMember.role}
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                placeholder="役割"
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <input
                type="email"
                value={newMember.email || ''}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                placeholder="メールアドレス (任意)"
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={addMember}
                  disabled={!newMember.name.trim() || !newMember.role.trim()}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={12} />
                  追加
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    resetNewMember();
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
            メンバーを追加
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

  const members = content.members || [];

  return (
    <div className="group relative">
      {members.length === 0 ? (
        <div className="text-xs text-gray-500 py-2">
          メンバーが登録されていません。
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className={`p-2 rounded-lg border text-xs ${getStatusColor(member.status)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getStatusIcon(member.status)}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{member.name}</div>
                    <div className="text-xs opacity-75 truncate">{member.role}</div>
                  </div>
                </div>
              </div>
              
              {member.email && (
                <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                  <Mail size={10} />
                  <span className="truncate">{member.email}</span>
                </div>
              )}
              
              {member.skills.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Code size={10} className="text-gray-400 flex-shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {member.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="px-1.5 py-0.5 bg-white bg-opacity-50 text-xs rounded border"
                      >
                        {skill}
                      </span>
                    ))}
                    {member.skills.length > 3 && (
                      <span className="text-xs opacity-75">
                        +{member.skills.length - 3}
                      </span>
                    )}
                  </div>
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