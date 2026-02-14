
import React, { useState } from 'react';
import { Server, Role, Permission, User } from '../types';
import { ICONS } from '../constants';
import { GripVertical, Trash2, Crown, Copy, Check } from 'lucide-react';

interface ServerSettingsProps {
  server: Server;
  allUsers: User[];
  onClose: () => void;
  onUpdateServer: (updates: Partial<Server>) => void;
}

const ServerSettings: React.FC<ServerSettingsProps> = ({ server, allUsers, onClose, onUpdateServer }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'members'>('overview');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [draggedRoleIndex, setDraggedRoleIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const availablePermissions: Permission[] = ['MANAGE_SERVER', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'KICK_MEMBERS', 'SEND_MESSAGES', 'MENTION_EVERYONE'];
  
  const inviteLink = `https://cumcurry.co/invite/${server.id}`;

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePermission = (role: Role, perm: Permission) => {
    const newPerms = role.permissions.includes(perm)
      ? role.permissions.filter(p => p !== perm)
      : [...role.permissions, perm];
    
    const updatedRoles = server.roles.map(r => r.id === role.id ? { ...r, permissions: newPerms } : r);
    onUpdateServer({ roles: updatedRoles });
    if (editingRole?.id === role.id) setEditingRole({ ...role, permissions: newPerms });
  };

  const addRole = () => {
    const newRole: Role = {
      id: 'role_' + Date.now(),
      name: 'new rank',
      color: '#D4AF37',
      permissions: ['SEND_MESSAGES']
    };
    onUpdateServer({ roles: [...server.roles, newRole] });
    setEditingRole(newRole);
  };

  const deleteRole = (roleId: string) => {
    const updatedRoles = server.roles.filter(r => r.id !== roleId);
    onUpdateServer({ roles: updatedRoles });
    if (editingRole?.id === roleId) setEditingRole(null);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    // Prevent dragging the owner role (index 0)
    if (index === 0) {
        e.preventDefault();
        return;
    }
    setDraggedRoleIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    // Prevent dropping onto the owner role (index 0)
    if (index === 0) {
        e.dataTransfer.dropEffect = 'none';
        return;
    }
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedRoleIndex === null || draggedRoleIndex === dropIndex) return;
    if (dropIndex === 0) return; // Cannot displace owner role

    const newRoles = [...server.roles];
    const [draggedRole] = newRoles.splice(draggedRoleIndex, 1);
    newRoles.splice(dropIndex, 0, draggedRole);

    onUpdateServer({ roles: newRoles });
    setDraggedRoleIndex(null);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] flex animate-in fade-in zoom-in-95 duration-200">
      {/* Settings Sidebar */}
      <div className="w-64 bg-[#080808] border-r border-[#3d2b0f] p-6 flex flex-col gap-1">
        <div className="text-[10px] font-bold uppercase text-[#5c4010] tracking-[0.2em] mb-6 px-2 royal-font">Court Decree</div>
        <button 
          onClick={() => setActiveTab('overview')}
          className={`w-full text-left px-4 py-3 border-l-2 text-sm font-bold transition-all royal-font tracking-wide ${activeTab === 'overview' ? 'border-[#D4AF37] bg-[#1a1a1a] text-[#F4C430]' : 'border-transparent text-[#8a7038] hover:text-[#D4AF37]'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          className={`w-full text-left px-4 py-3 border-l-2 text-sm font-bold transition-all royal-font tracking-wide ${activeTab === 'roles' ? 'border-[#D4AF37] bg-[#1a1a1a] text-[#F4C430]' : 'border-transparent text-[#8a7038] hover:text-[#D4AF37]'}`}
        >
          Hierarchy
        </button>
        <button 
          onClick={() => setActiveTab('members')}
          className={`w-full text-left px-4 py-3 border-l-2 text-sm font-bold transition-all royal-font tracking-wide ${activeTab === 'members' ? 'border-[#D4AF37] bg-[#1a1a1a] text-[#F4C430]' : 'border-transparent text-[#8a7038] hover:text-[#D4AF37]'}`}
        >
          Subjects
        </button>
        
        <div className="mt-auto pt-6 border-t border-[#3d2b0f]">
          <button 
            onClick={onClose}
            className="w-full flex items-center justify-between px-4 py-3 border border-[#3d2b0f] hover:border-[#8a7038] text-[#8a7038] hover:text-[#D4AF37] transition-all text-xs font-bold uppercase tracking-widest royal-font"
          >
            Depart
            <span className="scale-75 opacity-50">ESC</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#050505] p-16 overflow-y-auto custom-scrollbar mandala-bg">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h1 className="text-3xl royal-font font-bold uppercase tracking-widest text-[#D4AF37] mb-2">Dominion Overview</h1>
                <p className="text-[#8a7038] font-serif italic">The fundamental laws of your realm.</p>
              </div>

              <div className="flex gap-10 items-start">
                <div className="relative group cursor-pointer">
                  <img src={server.icon} className="w-32 h-32 rounded-full object-cover border-4 border-[#3d2b0f] shadow-2xl transition-all group-hover:opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold uppercase bg-black text-[#D4AF37] border border-[#D4AF37] px-3 py-1">Modify</span>
                  </div>
                </div>
                <div className="flex-1 space-y-8">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#5c4010] tracking-widest mb-3 royal-font">Realm Name</label>
                    <input 
                      type="text" 
                      value={server.name}
                      onChange={(e) => onUpdateServer({ name: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-[#3d2b0f] p-4 text-[#F5F5DC] font-medium focus:outline-none focus:border-[#D4AF37]" 
                    />
                  </div>

                  <div className="bg-[#0a0a0a] border border-[#3d2b0f] p-4">
                    <label className="block text-[10px] font-bold uppercase text-[#5c4010] tracking-widest mb-2 royal-font">Realm Invite Link</label>
                    <div className="flex gap-2">
                        <input 
                        readOnly 
                        value={inviteLink}
                        className="flex-1 bg-[#050505] border border-[#3d2b0f] p-3 text-[#8a7038] font-mono text-xs focus:outline-none"
                        />
                        <button 
                        onClick={copyInvite}
                        className="px-4 bg-[#1a1a1a] border border-[#3d2b0f] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all flex items-center justify-center"
                        >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-end border-b border-[#3d2b0f] pb-6">
                <div>
                  <h1 className="text-3xl royal-font font-bold uppercase tracking-widest text-[#D4AF37] mb-2">Hierarchy</h1>
                  <p className="text-[#8a7038] font-serif italic">Establish order among the ranks.</p>
                </div>
                <button onClick={addRole} className="px-6 py-3 bg-[#1a1a1a] border border-[#D4AF37] text-[#D4AF37] text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all">New Rank</button>
              </div>

              <div className="grid grid-cols-[300px_1fr] gap-10">
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-[#5c4010] tracking-widest px-2 mb-2 royal-font">Drag to Reorder</div>
                  {server.roles.map((role, index) => {
                    const isOwnerRole = index === 0;
                    return (
                        <div
                            key={role.id}
                            draggable={!isOwnerRole}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onClick={() => setEditingRole(role)}
                            className={`w-full text-left px-3 py-3 border text-sm font-bold transition-all flex items-center gap-3 group relative
                                ${editingRole?.id === role.id 
                                    ? 'bg-[#1a1a1a] border-[#D4AF37] text-[#F4C430] z-10' 
                                    : 'border-transparent bg-[#080808] text-[#8a7038] hover:bg-[#111] hover:text-[#D4AF37]'
                                }
                                ${draggedRoleIndex === index ? 'opacity-50 border-dashed border-[#8a7038]' : ''}
                                ${isOwnerRole ? 'border-[#5c4010] bg-[#0a0a0a]' : 'cursor-pointer'}
                            `}
                        >
                            <div className={`shrink-0 ${isOwnerRole ? 'cursor-default' : 'cursor-move text-[#5c4010] hover:text-[#D4AF37]'}`}>
                                {isOwnerRole ? <Crown size={14} className="text-[#D4AF37]" /> : <GripVertical size={14} />}
                            </div>
                            
                            <div className="flex-1 flex items-center gap-3 overflow-hidden">
                                <div className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_5px_currentColor]" style={{ backgroundColor: role.color }} />
                                <span className="royal-font tracking-wide uppercase text-xs truncate">{role.name}</span>
                            </div>

                            {!isOwnerRole && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); deleteRole(role.id); }}
                                        className="p-1.5 hover:bg-red-900/20 text-red-800 hover:text-red-500 rounded transition-colors"
                                        title="Delete Rank"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                            
                            {/* Selection Indicator */}
                            {editingRole?.id === role.id && (
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#D4AF37]" />
                            )}
                        </div>
                    );
                  })}
                </div>

                <div className="bg-[#0a0a0a] border border-[#3d2b0f] p-8 min-h-[400px]">
                  {editingRole ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="flex items-center justify-between">
                         <h3 className="text-sm font-bold uppercase tracking-widest text-[#F4C430] royal-font">Editing: {editingRole.name}</h3>
                         {server.roles[0].id === editingRole.id && (
                             <span className="text-[10px] font-bold uppercase bg-[#D4AF37] text-black px-2 py-0.5 rounded-sm">High Command</span>
                         )}
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#5c4010] tracking-widest mb-3 royal-font">Title</label>
                        <input 
                          type="text" 
                          value={editingRole.name}
                          onChange={(e) => {
                            const updated = { ...editingRole, name: e.target.value };
                            setEditingRole(updated);
                            onUpdateServer({ roles: server.roles.map(r => r.id === editingRole.id ? updated : r) });
                          }}
                          className="w-full bg-[#050505] border border-[#3d2b0f] p-4 text-[#F5F5DC] font-medium focus:outline-none focus:border-[#D4AF37]" 
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#5c4010] tracking-widest mb-3 royal-font">Color</label>
                        <div className="flex items-center gap-4">
                           <input 
                             type="color" 
                             value={editingRole.color}
                             onChange={(e) => {
                                const updated = { ...editingRole, color: e.target.value };
                                setEditingRole(updated);
                                onUpdateServer({ roles: server.roles.map(r => r.id === editingRole.id ? updated : r) });
                             }}
                             className="w-12 h-12 p-1 bg-[#050505] border border-[#3d2b0f] cursor-pointer"
                           />
                           <span className="text-xs font-mono text-[#8a7038]">{editingRole.color}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#5c4010] tracking-widest mb-4 royal-font">Privileges</label>
                        <div className="space-y-2">
                          {availablePermissions.map(perm => (
                            <div key={perm} className="flex items-center justify-between p-4 bg-[#050505] border border-[#3d2b0f] hover:border-[#5c4010] transition-colors">
                              <div>
                                <div className="text-xs font-bold text-[#D4AF37] uppercase tracking-wide mb-1">{perm.replace('_', ' ')}</div>
                                <div className="text-[10px] text-[#8a7038]">Grant authority to {perm.toLowerCase().replace('_', ' ')}.</div>
                              </div>
                              <button 
                                onClick={() => togglePermission(editingRole, perm)}
                                className={`w-10 h-5 border transition-all relative ${editingRole.permissions.includes(perm) ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-[#3d2b0f] bg-transparent'}`}
                              >
                                <div className={`absolute top-0.5 w-3.5 h-3.5 bg-[#D4AF37] transition-all ${editingRole.permissions.includes(perm) ? 'right-0.5' : 'left-0.5 opacity-20'}`} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                      <div className="text-5xl mb-4 text-[#D4AF37]">⚜️</div>
                      <div className="font-bold uppercase text-xs tracking-widest text-[#8a7038]">Select a rank to modify</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h1 className="text-3xl royal-font font-bold uppercase tracking-widest text-[#D4AF37] mb-2">Subjects</h1>
                <p className="text-[#8a7038] font-serif italic">The people of the realm.</p>
              </div>

              <div className="border border-[#3d2b0f]">
                <table className="w-full text-left">
                  <thead className="bg-[#0a0a0a] text-[10px] font-bold uppercase text-[#5c4010] tracking-widest border-b border-[#3d2b0f]">
                    <tr>
                      <th className="px-6 py-4 royal-font">Identity</th>
                      <th className="px-6 py-4 royal-font">Rank</th>
                      <th className="px-6 py-4 text-right royal-font">Judgement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3d2b0f]">
                    {allUsers.map(user => (
                      <tr key={user.id} className="group hover:bg-[#D4AF37]/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-[#3d2b0f]" />
                            <div>
                              <div className="text-sm font-bold text-[#E5C100] uppercase tracking-wide royal-font">{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {server.roles.map(role => {
                                const isAssigned = server.memberRoles[user.id]?.includes(role.id);
                                return (
                                    <button 
                                        key={role.id}
                                        onClick={() => {
                                            const current = server.memberRoles[user.id] || [];
                                            const updated = current.includes(role.id) ? current.filter(id => id !== role.id) : [...current, role.id];
                                            onUpdateServer({ memberRoles: { ...server.memberRoles, [user.id]: updated } });
                                        }}
                                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider border transition-all ${isAssigned ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' : 'border-[#3d2b0f] text-[#5c4010] hover:border-[#8a7038]'}`}
                                    >
                                        {role.name}
                                    </button>
                                );
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {server.ownerId !== user.id && (
                            <button className="text-[#5c4010] hover:text-red-600 transition-colors">
                              {ICONS.LogOut}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerSettings;
