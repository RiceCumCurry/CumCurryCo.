
import React, { useState } from 'react';
import { Server, Role, Permission, User } from '../types';
import { ICONS } from '../constants';

interface ServerSettingsProps {
  server: Server;
  allUsers: User[];
  onClose: () => void;
  onUpdateServer: (updates: Partial<Server>) => void;
}

const ServerSettings: React.FC<ServerSettingsProps> = ({ server, allUsers, onClose, onUpdateServer }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'members'>('overview');
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const availablePermissions: Permission[] = ['MANAGE_SERVER', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'KICK_MEMBERS', 'SEND_MESSAGES', 'MENTION_EVERYONE'];

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

              <div className="grid grid-cols-[250px_1fr] gap-10">
                <div className="space-y-1">
                  {server.roles.map(role => (
                    <button 
                      key={role.id}
                      onClick={() => setEditingRole(role)}
                      className={`w-full text-left px-4 py-3 border border-transparent text-sm font-bold transition-all flex items-center justify-between group ${editingRole?.id === role.id ? 'bg-[#1a1a1a] border-[#5c4010] text-[#F4C430]' : 'text-[#8a7038] hover:bg-[#111]'}`}
                    >
                      <span className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }} />
                        <span className="royal-font tracking-wide uppercase text-xs">{role.name}</span>
                      </span>
                      {ICONS.ChevronDown}
                    </button>
                  ))}
                </div>

                <div className="bg-[#0a0a0a] border border-[#3d2b0f] p-8 min-h-[400px]">
                  {editingRole ? (
                    <div className="space-y-8">
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
