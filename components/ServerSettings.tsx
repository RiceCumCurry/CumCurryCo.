
import React, { useState, useRef, useEffect } from 'react';
import { Server, Role, Permission, User } from '../types';
import { ICONS } from '../constants';
import { GripVertical, Trash2, Crown, Copy, Check, Upload, Search, Globe, Lock } from 'lucide-react';
import { GiphyPicker } from './GiphyPicker';

interface ServerSettingsProps {
  server: Server;
  allUsers: User[];
  onClose: () => void;
  onUpdateServer: (updates: Partial<Server>) => void;
}

const THEMES = [
  { id: 'royal', name: 'Royal Court', color: '#D4AF37' },
  { id: 'prismatic', name: 'Prismatic', color: '#00ff9d' },
  { id: 'minimalist', name: 'Void', color: '#525252' },
  { id: 'formula1', name: 'Grand Prix', color: '#FF1801' },
  { id: 'redbull', name: 'Wings', color: '#0C1528' }
];

const ServerSettings: React.FC<ServerSettingsProps> = ({ server, allUsers, onClose, onUpdateServer }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'members'>('overview');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [draggedRoleIndex, setDraggedRoleIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Giphy State
  const [showGiphyPicker, setShowGiphyPicker] = useState(false);
  const [giphyTarget, setGiphyTarget] = useState<'icon' | 'banner' | null>(null);

  // File Refs
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Add ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showGiphyPicker) {
            setShowGiphyPicker(false);
        } else {
            onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showGiphyPicker]);

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
      icon: '🛡️',
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
    if (index === 0) {
        e.preventDefault();
        return;
    }
    setDraggedRoleIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (index === 0) {
        e.dataTransfer.dropEffect = 'none';
        return;
    }
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedRoleIndex === null || draggedRoleIndex === dropIndex) return;
    if (dropIndex === 0) return; 

    const newRoles = [...server.roles];
    const [draggedRole] = newRoles.splice(draggedRoleIndex, 1);
    newRoles.splice(dropIndex, 0, draggedRole);

    onUpdateServer({ roles: newRoles });
    setDraggedRoleIndex(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'icon' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateServer({ [field]: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openGiphy = (target: 'icon' | 'banner') => {
    setGiphyTarget(target);
    setShowGiphyPicker(true);
  };

  const handleGiphySelect = (url: string) => {
    if (giphyTarget === 'icon') {
      onUpdateServer({ icon: url });
    } else if (giphyTarget === 'banner') {
      onUpdateServer({ banner: url });
    }
    setShowGiphyPicker(false);
    setGiphyTarget(null);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-theme-bg flex animate-in fade-in zoom-in-95 duration-200">
      
      {showGiphyPicker && (
        <GiphyPicker 
          onClose={() => setShowGiphyPicker(false)} 
          onSelect={handleGiphySelect} 
        />
      )}

      {/* Settings Sidebar */}
      <div className="w-64 bg-theme-panel border-r border-theme-border p-6 flex flex-col gap-1">
        <div className="text-[10px] font-bold uppercase text-theme-text-dim tracking-[0.2em] mb-6 px-2 royal-font">Court Decree</div>
        <button 
          onClick={() => setActiveTab('overview')}
          className={`w-full text-left px-4 py-3 border-l-2 text-sm font-bold transition-all royal-font tracking-wide ${activeTab === 'overview' ? 'border-theme-gold bg-white/5 text-theme-gold-light' : 'border-transparent text-theme-text-muted hover:text-theme-gold'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          className={`w-full text-left px-4 py-3 border-l-2 text-sm font-bold transition-all royal-font tracking-wide ${activeTab === 'roles' ? 'border-theme-gold bg-white/5 text-theme-gold-light' : 'border-transparent text-theme-text-muted hover:text-theme-gold'}`}
        >
          Hierarchy
        </button>
        <button 
          onClick={() => setActiveTab('members')}
          className={`w-full text-left px-4 py-3 border-l-2 text-sm font-bold transition-all royal-font tracking-wide ${activeTab === 'members' ? 'border-theme-gold bg-white/5 text-theme-gold-light' : 'border-transparent text-theme-text-muted hover:text-theme-gold'}`}
        >
          Subjects
        </button>
        
        <div className="mt-auto pt-6 border-t border-theme-border">
          <button 
            onClick={onClose}
            className="w-full flex items-center justify-between px-4 py-3 border border-theme-border hover:border-theme-text-muted text-theme-text-muted hover:text-theme-gold transition-all text-xs font-bold uppercase tracking-widest royal-font"
          >
            Depart
            <span className="scale-75 opacity-50">ESC</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-theme-bg p-16 overflow-y-auto custom-scrollbar mandala-bg">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h1 className="text-3xl royal-font font-bold uppercase tracking-widest text-theme-gold mb-2">Dominion Overview</h1>
                <p className="text-theme-text-muted font-serif italic">The fundamental laws of your realm.</p>
              </div>

              {/* Banner Edit */}
              <div className="relative w-full h-32 bg-theme-panel border border-theme-border group overflow-hidden">
                 <img src={server.banner || "https://picsum.photos/seed/default_banner/800/200"} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-all" />
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                    <button 
                        onClick={() => bannerInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-black/80 text-theme-gold border border-theme-gold font-bold uppercase text-[10px] tracking-widest hover:bg-theme-gold hover:text-black transition-all"
                    >
                        <Upload size={14} /> Upload
                    </button>
                    <button 
                        onClick={() => openGiphy('banner')}
                        className="flex items-center gap-2 px-4 py-2 bg-black/80 text-theme-gold-light border border-theme-gold-light font-bold uppercase text-[10px] tracking-widest hover:bg-theme-gold-light hover:text-black transition-all"
                    >
                        <Search size={14} /> Giphy
                    </button>
                    <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
                 </div>
              </div>

              <div className="flex gap-10 items-start">
                <div className="relative group cursor-pointer -mt-10">
                  <img src={server.icon} className="w-32 h-32 rounded-full object-cover border-4 border-theme-bg shadow-2xl transition-all group-hover:opacity-50" />
                  <div className="absolute inset-0 bg-black/80 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                    <button 
                        onClick={() => iconInputRef.current?.click()}
                        className="flex flex-col items-center gap-1 group/btn"
                    >
                        <Upload size={14} className="text-theme-gold group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[8px] font-bold uppercase text-theme-gold royal-font">Img</span>
                    </button>
                    <div className="w-8 h-[1px] bg-theme-border" />
                    <button 
                        onClick={() => openGiphy('icon')}
                        className="flex flex-col items-center gap-1 group/btn"
                    >
                        <Search size={14} className="text-theme-gold-light group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[8px] font-bold uppercase text-theme-gold-light royal-font">Gif</span>
                    </button>
                    <input type="file" ref={iconInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'icon')} />
                  </div>
                </div>
                <div className="flex-1 space-y-8">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-theme-text-dim tracking-widest mb-3 royal-font">Realm Name</label>
                    <input 
                      type="text" 
                      value={server.name}
                      onChange={(e) => onUpdateServer({ name: e.target.value })}
                      className="w-full bg-theme-panel border border-theme-border p-4 text-theme-text font-medium focus:outline-none focus:border-theme-gold" 
                    />
                  </div>

                  {/* Public Visibility Toggle */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-theme-text-dim tracking-widest mb-3 royal-font">Realm Visibility</label>
                    <button 
                      onClick={() => onUpdateServer({ isPublic: !server.isPublic })}
                      className={`w-full flex items-center justify-between p-4 border transition-all ${server.isPublic ? 'border-theme-gold bg-white/5' : 'border-theme-border hover:border-theme-text-muted bg-theme-panel'}`}
                    >
                        <div className="flex items-center gap-4">
                           <div className={`p-2 rounded-full ${server.isPublic ? 'bg-theme-gold/20 text-theme-gold' : 'bg-white/5 text-theme-text-dim'}`}>
                             {server.isPublic ? <Globe size={20} /> : <Lock size={20} />}
                           </div>
                           <div className="text-left">
                              <div className={`text-sm font-bold uppercase tracking-wider royal-font ${server.isPublic ? 'text-theme-gold-light' : 'text-theme-text-muted'}`}>
                                {server.isPublic ? 'Public Domain' : 'Secret Society'}
                              </div>
                              <div className="text-[10px] text-theme-text-dim mt-1">
                                {server.isPublic ? 'Discoverable by all via the Explore tab.' : 'Only invited members may enter.'}
                              </div>
                           </div>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-all ${server.isPublic ? 'bg-theme-gold' : 'bg-theme-border'}`}>
                             <div className={`absolute top-1 w-3 h-3 rounded-full bg-black transition-all ${server.isPublic ? 'right-1' : 'left-1'}`} />
                        </div>
                    </button>
                  </div>

                  {/* Theme Selector */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-theme-text-dim tracking-widest mb-3 royal-font">Realm Theme</label>
                    <div className="grid grid-cols-3 gap-4">
                        {THEMES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => onUpdateServer({ theme: t.id as any })}
                                className={`border p-4 flex flex-col items-center gap-2 transition-all ${server.theme === t.id ? 'border-theme-gold bg-white/5' : 'border-theme-border hover:border-theme-text-muted'}`}
                            >
                                <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.color }} />
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${server.theme === t.id ? 'text-theme-gold' : 'text-theme-text-muted'}`}>{t.name}</span>
                            </button>
                        ))}
                    </div>
                  </div>

                  <div className="bg-theme-panel border border-theme-border p-4">
                    <label className="block text-[10px] font-bold uppercase text-theme-text-dim tracking-widest mb-2 royal-font">Realm Invite Link</label>
                    <div className="flex gap-2">
                        <input 
                        readOnly 
                        value={inviteLink}
                        className="flex-1 bg-theme-bg border border-theme-border p-3 text-theme-text-muted font-mono text-xs focus:outline-none"
                        />
                        <button 
                        onClick={copyInvite}
                        className="px-4 bg-theme-panel border border-theme-border text-theme-gold hover:bg-theme-gold hover:text-black transition-all flex items-center justify-center"
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
              <div className="flex justify-between items-end border-b border-theme-border pb-6">
                <div>
                  <h1 className="text-3xl royal-font font-bold uppercase tracking-widest text-theme-gold mb-2">Hierarchy</h1>
                  <p className="text-theme-text-muted font-serif italic">Establish order among the ranks.</p>
                </div>
                <button onClick={addRole} className="px-6 py-3 bg-theme-panel border border-theme-gold text-theme-gold text-xs font-bold uppercase tracking-widest hover:bg-theme-gold hover:text-black transition-all">New Rank</button>
              </div>

              <div className="grid grid-cols-[300px_1fr] gap-10">
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-theme-text-dim tracking-widest px-2 mb-2 royal-font">Drag to Reorder</div>
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
                                    ? 'bg-white/5 border-theme-gold text-theme-gold-light z-10' 
                                    : 'border-transparent bg-theme-panel text-theme-text-muted hover:bg-white/5 hover:text-theme-gold'
                                }
                                ${draggedRoleIndex === index ? 'opacity-50 border-dashed border-theme-text-muted' : ''}
                                ${isOwnerRole ? 'border-theme-text-dim bg-theme-panel' : 'cursor-pointer'}
                            `}
                        >
                            <div className={`shrink-0 ${isOwnerRole ? 'cursor-default' : 'cursor-move text-theme-text-dim hover:text-theme-gold'}`}>
                                {isOwnerRole ? <Crown size={14} className="text-theme-gold" /> : <GripVertical size={14} />}
                            </div>
                            
                            <div className="flex-1 flex items-center gap-3 overflow-hidden">
                                {role.icon && <span className="text-base">{role.icon}</span>}
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
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-theme-gold" />
                            )}
                        </div>
                    );
                  })}
                </div>

                <div className="bg-theme-panel border border-theme-border p-8 min-h-[400px]">
                  {editingRole ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="flex items-center justify-between">
                         <h3 className="text-sm font-bold uppercase tracking-widest text-theme-gold-light royal-font">Editing: {editingRole.name}</h3>
                         {server.roles[0].id === editingRole.id && (
                             <span className="text-[10px] font-bold uppercase bg-theme-gold text-black px-2 py-0.5 rounded-sm">High Command</span>
                         )}
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-theme-text-dim tracking-widest mb-3 royal-font">Title</label>
                        <input 
                          type="text" 
                          value={editingRole.name}
                          onChange={(e) => {
                            const updated = { ...editingRole, name: e.target.value };
                            setEditingRole(updated);
                            onUpdateServer({ roles: server.roles.map(r => r.id === editingRole.id ? updated : r) });
                          }}
                          className="w-full bg-theme-bg border border-theme-border p-4 text-theme-text font-medium focus:outline-none focus:border-theme-gold" 
                        />
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold uppercase text-theme-text-dim tracking-widest mb-3 royal-font">Color</label>
                            <div className="flex items-center gap-4">
                            <input 
                                type="color" 
                                value={editingRole.color}
                                onChange={(e) => {
                                    const updated = { ...editingRole, color: e.target.value };
                                    setEditingRole(updated);
                                    onUpdateServer({ roles: server.roles.map(r => r.id === editingRole.id ? updated : r) });
                                }}
                                className="w-12 h-12 p-1 bg-theme-bg border border-theme-border cursor-pointer"
                            />
                            <span className="text-xs font-mono text-theme-text-muted">{editingRole.color}</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold uppercase text-theme-text-dim tracking-widest mb-3 royal-font">Badge Emoji</label>
                            <input 
                                type="text" 
                                maxLength={2}
                                value={editingRole.icon || ''}
                                onChange={(e) => {
                                    const updated = { ...editingRole, icon: e.target.value };
                                    setEditingRole(updated);
                                    onUpdateServer({ roles: server.roles.map(r => r.id === editingRole.id ? updated : r) });
                                }}
                                className="w-full bg-theme-bg border border-theme-border p-3 text-center text-xl text-theme-text font-medium focus:outline-none focus:border-theme-gold placeholder-theme-text-dim"
                                placeholder="🛡️" 
                            />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-theme-text-dim tracking-widest mb-4 royal-font">Privileges</label>
                        <div className="space-y-2">
                          {availablePermissions.map(perm => (
                            <div key={perm} className="flex items-center justify-between p-4 bg-theme-bg border border-theme-border hover:border-theme-text-dim transition-colors">
                              <div>
                                <div className="text-xs font-bold text-theme-gold uppercase tracking-wide mb-1">{perm.replace('_', ' ')}</div>
                                <div className="text-[10px] text-theme-text-muted">Grant authority to {perm.toLowerCase().replace('_', ' ')}.</div>
                              </div>
                              <button 
                                onClick={() => togglePermission(editingRole, perm)}
                                className={`w-10 h-5 border transition-all relative ${editingRole.permissions.includes(perm) ? 'border-theme-gold bg-theme-gold/10' : 'border-theme-border bg-transparent'}`}
                              >
                                <div className={`absolute top-0.5 w-3.5 h-3.5 bg-theme-gold transition-all ${editingRole.permissions.includes(perm) ? 'right-0.5' : 'left-0.5 opacity-20'}`} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                      <div className="text-5xl mb-4 text-theme-gold">⚜️</div>
                      <div className="font-bold uppercase text-xs tracking-widest text-theme-text-muted">Select a rank to modify</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h1 className="text-3xl royal-font font-bold uppercase tracking-widest text-theme-gold mb-2">Subjects</h1>
                <p className="text-theme-text-muted font-serif italic">The people of the realm.</p>
              </div>

              <div className="border border-theme-border">
                <table className="w-full text-left">
                  <thead className="bg-theme-panel text-[10px] font-bold uppercase text-theme-text-dim tracking-widest border-b border-theme-border">
                    <tr>
                      <th className="px-6 py-4 royal-font">Identity</th>
                      <th className="px-6 py-4 royal-font">Rank</th>
                      <th className="px-6 py-4 text-right royal-font">Judgement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border">
                    {allUsers.map(user => (
                      <tr key={user.id} className="group hover:bg-theme-gold/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-theme-border" />
                            <div>
                              <div className="text-sm font-bold text-theme-text-highlight uppercase tracking-wide royal-font">{user.username}</div>
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
                                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1 ${isAssigned ? 'border-theme-gold text-theme-gold bg-theme-gold/10' : 'border-theme-border text-theme-text-dim hover:border-theme-text-muted'}`}
                                    >
                                        {role.icon && <span>{role.icon}</span>}
                                        {role.name}
                                    </button>
                                );
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {server.ownerId !== user.id && (
                            <button className="text-theme-text-dim hover:text-red-600 transition-colors">
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
