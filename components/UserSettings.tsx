
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { ICONS } from '../constants';
import MicVisualizer from './MicVisualizer';
import { Dice5, Upload, Link as LinkIcon, Search, Loader2, RotateCw, Palette } from 'lucide-react';
import { GiphyPicker } from './GiphyPicker';

// --- Theme Config ---
const THEMES = {
  royal: {
    name: 'Royal Court',
    border: '#D4AF37',
    accent: '#F4C430',
    shadow: 'rgba(212,175,55,0.4)',
    bg: '#000000'
  },
  prismatic: {
    name: 'Prismatic',
    border: '#00ff9d',
    accent: '#00ff9d',
    shadow: 'rgba(0, 255, 157, 0.4)',
    bg: '#000000'
  },
  minimalist: {
    name: 'Void',
    border: '#525252',
    accent: '#e5e5e5',
    shadow: 'rgba(255, 255, 255, 0.1)',
    bg: '#171717'
  },
  formula1: {
    name: 'Grand Prix',
    border: '#FF1801',
    accent: '#FFFFFF',
    shadow: 'rgba(255, 24, 1, 0.4)',
    bg: '#101010'
  },
  redbull: {
    name: 'Wings',
    border: '#CC1E4A',
    accent: '#FBB800',
    shadow: 'rgba(204, 30, 74, 0.4)',
    bg: '#0C1528'
  }
};

interface UserSettingsProps {
  user: User;
  noiseThreshold: number;
  onSettingsChange: (settings: { noiseThreshold?: number; isMicMuted?: boolean }) => void;
  onClose: () => void;
  onUpdateUser: (updates: Partial<User>) => Promise<boolean | string>;
  onLogout: () => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({ user, noiseThreshold, onSettingsChange, onClose, onUpdateUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'audio'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    banner: user.banner || '',
    status: user.status,
    customStatus: user.customStatus || '',
    profileTheme: user.profileTheme || 'royal'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Giphy State
  const [showGiphyPicker, setShowGiphyPicker] = useState(false);
  const [giphyTarget, setGiphyTarget] = useState<'avatar' | 'banner' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Helper to compress images before storing
  const compressImage = (file: File, maxWidth: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Reject GIFs immediately if uploaded via file, prompt to use Giphy
      if (file.type === 'image/gif') {
         reject(new Error("For GIFs, please use the Giphy Portal search button."));
         return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize logic
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress quality to 0.7
            resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.7)); 
          } else {
            reject(new Error("Canvas context failed"));
          }
        };
        img.onerror = () => reject(new Error("Failed to load image"));
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
    });
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    if (!editForm.username.trim() || !editForm.email.trim()) {
      setError('Identity cannot be void.');
      return;
    }

    try {
      const result = await onUpdateUser({
        username: editForm.username,
        email: editForm.email,
        avatar: editForm.avatar,
        banner: editForm.banner,
        status: editForm.status,
        customStatus: editForm.customStatus,
        profileTheme: editForm.profileTheme as any
      });

      if (result === true) {
        setSuccess('Records updated.');
        setIsEditing(false);
      } else {
        setError(typeof result === 'string' ? result : 'Update failed.');
      }
    } catch (e) {
      setError("Storage limit exceeded. Try using a smaller image.");
    }
  };

  const handleCancel = () => {
    setEditForm({
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      banner: user.banner || '',
      status: user.status,
      customStatus: user.customStatus || '',
      profileTheme: user.profileTheme || 'royal'
    });
    setIsEditing(false);
    setError('');
  };

  const rollBanner = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 7 Colors Gradient
    const colors = Array.from({length: 7}, () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'));
    const gradient = `linear-gradient(45deg, ${colors.join(', ')})`;
    setEditForm(prev => ({ ...prev, banner: gradient }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 250); 
        setEditForm(prev => ({ ...prev, avatar: compressed }));
      } catch (err: any) {
        setError(err.message || "Failed to upload avatar");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800);
        setEditForm(prev => ({ ...prev, banner: compressed }));
      } catch (err: any) {
        setError(err.message || "Failed to upload banner");
      }
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const openGiphy = (target: 'avatar' | 'banner') => {
    setGiphyTarget(target);
    setShowGiphyPicker(true);
  };

  const handleGiphySelect = (url: string) => {
    if (giphyTarget === 'avatar') {
      setEditForm(prev => ({ ...prev, avatar: url }));
    } else if (giphyTarget === 'banner') {
      setEditForm(prev => ({ ...prev, banner: url }));
    }
    setShowGiphyPicker(false);
    setGiphyTarget(null);
  };

  const statusColors = {
    online: 'bg-green-600',
    idle: 'bg-yellow-600',
    dnd: 'bg-red-600',
    offline: 'bg-gray-600'
  };
  
  const currentTheme = THEMES[editForm.profileTheme as keyof typeof THEMES] || THEMES.royal;

  return (
    <div className="fixed inset-0 z-[200] bg-theme-bg flex animate-in fade-in zoom-in-95 duration-200">
      
      {showGiphyPicker && (
        <GiphyPicker 
          onClose={() => setShowGiphyPicker(false)} 
          onSelect={handleGiphySelect} 
        />
      )}

      <div className="w-64 bg-theme-panel border-r border-theme-border p-6 flex flex-col gap-1">
        <div className="text-[10px] font-bold uppercase text-theme-text-dim tracking-[0.2em] mb-6 px-2 royal-font">Personal Archive</div>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`w-full text-left px-4 py-3 border-l-2 text-sm font-bold transition-all royal-font tracking-wide ${activeTab === 'profile' ? 'border-theme-gold bg-white/5 text-theme-gold-light' : 'border-transparent text-theme-text-muted hover:text-theme-gold'}`}
        >
          Identity
        </button>
        <button 
          onClick={() => setActiveTab('audio')}
          className={`w-full text-left px-4 py-3 border-l-2 text-sm font-bold transition-all royal-font tracking-wide ${activeTab === 'audio' ? 'border-theme-gold bg-white/5 text-theme-gold-light' : 'border-transparent text-theme-text-muted hover:text-theme-gold'}`}
        >
          Resonance
        </button>
        
        <div className="mt-auto pt-6 border-t border-theme-border space-y-2">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-between px-4 py-3 border border-theme-border hover:border-red-900 text-red-800 hover:text-red-500 transition-all text-xs font-bold uppercase tracking-widest royal-font"
          >
            Abdicate
            {ICONS.LogOut}
          </button>
          <button 
            onClick={onClose}
            className="w-full flex items-center justify-between px-4 py-3 border border-theme-border hover:border-theme-text-muted text-theme-text-muted hover:text-theme-gold transition-all text-xs font-bold uppercase tracking-widest royal-font"
          >
            Return
            <span className="scale-75 opacity-50">ESC</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-theme-bg p-16 overflow-y-auto custom-scrollbar mandala-bg">
        <div className="max-w-3xl mx-auto">
          {activeTab === 'profile' && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
              <h1 className="text-3xl royal-font font-bold uppercase tracking-widest text-theme-gold">Your Legacy</h1>
              
              {error && (
                <div className="bg-red-900/10 border border-red-900/30 text-red-500 p-4 font-bold text-xs uppercase tracking-wide">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-900/10 border border-green-900/30 text-green-500 p-4 font-bold text-xs uppercase tracking-wide">
                  {success}
                </div>
              )}

              <div 
                className="bg-theme-panel overflow-hidden shadow-2xl transition-colors duration-300"
                style={{ border: `1px solid ${currentTheme.border}` }}
              >
                {/* Banner Preview/Edit */}
                <div 
                  className="h-32 bg-theme-bg relative group transition-colors duration-300"
                  style={{ borderBottom: `1px solid ${currentTheme.border}` }}
                >
                   {/* Background Render */}
                   <div className="absolute inset-0 w-full h-full overflow-hidden">
                     {editForm.banner && editForm.banner.startsWith('linear-gradient') ? (
                       <div 
                        className="w-full h-full animate-gradient-xy" 
                        style={{ background: editForm.banner }} 
                       />
                     ) : editForm.banner ? (
                       <img src={editForm.banner} className="w-full h-full object-cover opacity-60" />
                     ) : (
                      <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20" />
                     )}
                   </div>
                   
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 gap-3">
                       <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); bannerInputRef.current?.click(); }}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase text-theme-gold royal-font border border-theme-gold bg-black/50 px-3 py-1.5 hover:bg-theme-gold hover:text-black transition-all"
                          >
                            <Upload size={14} /> Upload Img
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openGiphy('banner'); }}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase text-theme-gold-light royal-font border border-theme-gold-light bg-black/50 px-3 py-1.5 hover:bg-theme-gold-light hover:text-black transition-all"
                          >
                            <Search size={14} /> Giphy
                          </button>
                          <button 
                            onClick={rollBanner}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase text-theme-gold royal-font border border-theme-gold bg-black/50 px-3 py-1.5 hover:bg-theme-gold hover:text-black transition-all"
                          >
                            <Dice5 size={14} /> Random
                          </button>
                       </div>
                       
                       <div className="flex items-center gap-2 w-72 bg-black/50 border border-theme-border px-2 focus-within:border-theme-gold transition-colors">
                          <LinkIcon size={12} className="text-theme-text-muted shrink-0" />
                          <input
                            type="text"
                            placeholder="Or paste URL..."
                            value={editForm.banner && !editForm.banner.startsWith('data:') && !editForm.banner.startsWith('linear-gradient') ? editForm.banner : ''}
                            onChange={(e) => setEditForm(prev => ({...prev, banner: e.target.value}))}
                            className="bg-transparent border-none text-[10px] text-theme-text w-full py-2 focus:outline-none placeholder-theme-text-dim"
                            onClick={e => e.stopPropagation()}
                          />
                       </div>

                       <input 
                         type="file" 
                         ref={bannerInputRef} 
                         className="hidden" 
                         accept="image/jpeg, image/png, image/webp" 
                         onChange={handleBannerUpload}
                       />
                    </div>
                  )}
                </div>

                <div className="px-10 pb-10 flex flex-col gap-8 -mt-16 relative z-10">
                  <div className="flex items-end justify-between">
                    <div className="relative group">
                      <img 
                        src={editForm.avatar} 
                        className="w-32 h-32 rounded-full shadow-2xl object-cover bg-black transition-all duration-300" 
                        style={{ 
                          border: `4px solid ${currentTheme.border}`,
                          boxShadow: `0 0 20px ${currentTheme.shadow}`
                        }}
                      />
                      <div 
                        className={`absolute bottom-2 right-2 w-8 h-8 rounded-full border-4 ${statusColors[editForm.status]}`} 
                        style={{ borderColor: currentTheme.border }}
                      />
                      
                      {isEditing && (
                        <div className="absolute inset-0 top-0 left-0 w-32 h-32 bg-black/80 rounded-full border-4 border-transparent flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all z-30">
                           <button 
                             onClick={() => fileInputRef.current?.click()}
                             className="flex flex-col items-center gap-1 group/btn"
                           >
                             <Upload size={14} className="text-theme-gold group-hover/btn:scale-110 transition-transform" />
                             <span className="text-[8px] font-bold uppercase text-theme-gold royal-font">Img</span>
                           </button>
                           
                           <div className="w-8 h-[1px] bg-theme-border" />
                           
                           <button 
                             onClick={() => openGiphy('avatar')}
                             className="flex flex-col items-center gap-1 group/btn"
                           >
                             <Search size={14} className="text-theme-gold-light group-hover/btn:scale-110 transition-transform" />
                             <span className="text-[8px] font-bold uppercase text-theme-gold-light royal-font">Gif</span>
                           </button>

                           <input 
                             type="file" 
                             ref={fileInputRef} 
                             className="hidden" 
                             accept="image/jpeg, image/png, image/webp" 
                             onChange={handleAvatarUpload}
                           />
                        </div>
                      )}
                    </div>
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className="px-6 py-2 border border-theme-border text-theme-text-muted hover:text-theme-gold hover:border-theme-gold transition-all text-xs font-bold uppercase tracking-widest royal-font">Rewrite History</button>
                    ) : (
                      <div className="flex gap-4">
                        <button onClick={handleCancel} className="px-6 py-2 text-theme-text-dim hover:text-theme-text-muted transition-all text-xs font-bold uppercase tracking-widest royal-font">Cancel</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-theme-gold text-black font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all royal-font">Seal Changes</button>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-theme-bg p-8 border border-theme-border space-y-8">
                    {/* ... (rest of form) ... */}
                    {/* Status Selection */}
                    {isEditing ? (
                      <div>
                         <label className="text-[10px] font-bold uppercase text-theme-text-dim tracking-widest block mb-3 royal-font">Presence</label>
                         <div className="flex gap-2 mb-4">
                           {(['online', 'idle', 'dnd', 'offline'] as const).map(s => (
                             <button
                               key={s}
                               onClick={() => setEditForm({ ...editForm, status: s })}
                               className={`flex-1 py-2 px-1 text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                                 editForm.status === s 
                                   ? 'border-theme-gold bg-theme-gold/10 text-theme-gold-light' 
                                   : 'border-theme-border text-theme-text-dim hover:border-theme-text-muted'
                               }`}
                             >
                               <div className={`w-2 h-2 rounded-full ${statusColors[s]}`} />
                               {s === 'offline' ? 'Invisible' : s === 'idle' ? 'Idle / AFK' : s}
                             </button>
                           ))}
                         </div>
                         <input 
                           type="text" 
                           placeholder="Set a custom status..."
                           value={editForm.customStatus} 
                           onChange={(e) => setEditForm({...editForm, customStatus: e.target.value})}
                           className="w-full bg-theme-panel border border-theme-border p-3 text-theme-text font-medium focus:outline-none focus:border-theme-gold transition-all placeholder-theme-text-dim text-sm"
                         />
                      </div>
                    ) : (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-theme-text-dim tracking-widest block mb-2 royal-font">Presence</label>
                        <div className="flex items-center gap-3">
                           <div className={`w-3 h-3 rounded-full ${statusColors[user.status]}`} />
                           <span className="text-theme-gold font-bold uppercase text-xs tracking-wide">
                             {user.status === 'offline' ? 'Invisible' : user.status}
                           </span>
                           {user.customStatus && (
                             <>
                               <span className="text-theme-border">|</span>
                               <span className="text-theme-text-muted font-serif italic">"{user.customStatus}"</span>
                             </>
                           )}
                        </div>
                      </div>
                    )}

                    {/* Theme Selection - Only visible when editing */}
                    {isEditing && (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-theme-text-dim tracking-widest block mb-3 royal-font">App & Profile Theme</label>
                        <div className="grid grid-cols-5 gap-3">
                          {Object.entries(THEMES).map(([key, style]) => (
                            <button
                              key={key}
                              onClick={() => setEditForm(prev => ({ ...prev, profileTheme: key as any }))}
                              className="relative overflow-hidden group border transition-all duration-300 h-16 flex items-center justify-center"
                              style={{ 
                                borderColor: editForm.profileTheme === key ? style.border : '#3d2b0f',
                                backgroundColor: style.bg
                              }}
                            >
                                <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(45deg, ${style.border}, transparent)` }} />
                                <span 
                                  className="relative z-10 text-[8px] font-bold uppercase tracking-wider transition-colors text-center px-1"
                                  style={{ color: editForm.profileTheme === key ? style.accent : '#8a7038' }}
                                >
                                  {style.name}
                                </span>
                                {editForm.profileTheme === key && (
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-current" style={{ color: style.border }} >
                                    <div className="absolute inset-0 bg-black opacity-20" />
                                  </div>
                                )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-bold uppercase text-theme-text-dim tracking-widest block mb-2 royal-font">Title</label>
                      {isEditing ? (
                         <input 
                           type="text" 
                           value={editForm.username} 
                           onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                           className="w-full bg-theme-panel border border-theme-border p-3 text-theme-text font-medium focus:outline-none focus:border-theme-gold transition-all"
                         />
                      ) : (
                        <div className="text-theme-text font-serif text-lg">{user.username}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-theme-text-dim tracking-widest block mb-2 royal-font">Correspondence</label>
                      {isEditing ? (
                         <input 
                           type="email" 
                           value={editForm.email} 
                           onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                           className="w-full bg-theme-panel border border-theme-border p-3 text-theme-text font-medium focus:outline-none focus:border-theme-gold transition-all"
                         />
                      ) : (
                        <div className="text-theme-text-muted font-serif">{user.email}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
             <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
               <h1 className="text-3xl royal-font font-bold uppercase tracking-widest text-theme-gold">Acoustics</h1>
               
               <div className="space-y-6">
                 <div className="bg-theme-panel p-8 border border-theme-border">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-theme-gold-light royal-font">Input Sensitivity</h3>
                     <span className="text-[10px] font-bold text-theme-gold bg-white/5 px-2 py-0.5 border border-theme-border">{Math.round(noiseThreshold * 100)}%</span>
                   </div>
                   <MicVisualizer threshold={noiseThreshold} />
                   <input 
                     type="range" 
                     min="0" 
                     max="1" 
                     step="0.01" 
                     value={noiseThreshold}
                     onChange={(e) => onSettingsChange({ noiseThreshold: parseFloat(e.target.value) })}
                     className="w-full mt-6 h-1 bg-theme-border rounded-none appearance-none cursor-pointer accent-theme-gold"
                   />
                   <div className="flex justify-between text-[10px] text-theme-text-dim font-bold uppercase mt-2 royal-font">
                      <span>Low Threshold (Whisper)</span>
                      <span>High Threshold (Shout)</span>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-theme-panel p-6 border border-theme-border hover:border-theme-gold transition-all cursor-pointer group">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-theme-gold group-hover:text-black transition-colors text-theme-text-muted">
                         {ICONS.Mic}
                      </div>
                      <h4 className="text-xs font-bold uppercase mb-2 text-theme-text-highlight royal-font">Continuous</h4>
                      <p className="text-[10px] text-theme-text-dim font-medium">Your voice is transmitted constantly when sound is detected above the threshold.</p>
                    </div>
                    <div className="bg-theme-panel p-6 border border-theme-border hover:border-theme-gold transition-all cursor-pointer group">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-theme-gold group-hover:text-black transition-colors text-theme-text-muted">
                         {ICONS.MicOff}
                      </div>
                      <h4 className="text-xs font-bold uppercase mb-2 text-theme-text-highlight royal-font">Push to Talk</h4>
                      <p className="text-[10px] text-theme-text-dim font-medium">Microphone remains silenced until a binding key is pressed.</p>
                    </div>
                 </div>
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
