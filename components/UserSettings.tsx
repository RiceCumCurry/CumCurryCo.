
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { ICONS } from '../constants';
import MicVisualizer from './MicVisualizer';
import { Dice5, Upload } from 'lucide-react';

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
    customStatus: user.customStatus || ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    if (!editForm.username.trim() || !editForm.email.trim()) {
      setError('Identity cannot be void.');
      return;
    }

    const result = await onUpdateUser({
      username: editForm.username,
      email: editForm.email,
      avatar: editForm.avatar,
      banner: editForm.banner,
      status: editForm.status,
      customStatus: editForm.customStatus
    });

    if (result === true) {
      setSuccess('Records updated.');
      setIsEditing(false);
    } else {
      setError(typeof result === 'string' ? result : 'Update failed.');
    }
  };

  const handleCancel = () => {
    setEditForm({
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      banner: user.banner || '',
      status: user.status,
      customStatus: user.customStatus || ''
    });
    setIsEditing(false);
    setError('');
  };

  const rollBanner = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    const gradient = `linear-gradient(45deg, ${randomColor()}, ${randomColor()}, ${randomColor()})`;
    setEditForm(prev => ({ ...prev, banner: gradient }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const statusColors = {
    online: 'bg-green-600',
    idle: 'bg-yellow-600',
    dnd: 'bg-red-600',
    offline: 'bg-gray-600'
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] flex animate-in fade-in zoom-in-95 duration-200">
      <div className="w-64 bg-[#080808] border-r border-[#3d2b0f] p-6 flex flex-col gap-1">
        <div className="text-[10px] font-bold uppercase text-[#5c4010] tracking-[0.2em] mb-6 px-2 royal-font">Personal Archive</div>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`w-full text-left px-4 py-3 border-l-2 text-sm font-bold transition-all royal-font tracking-wide ${activeTab === 'profile' ? 'border-[#D4AF37] bg-[#1a1a1a] text-[#F4C430]' : 'border-transparent text-[#8a7038] hover:text-[#D4AF37]'}`}
        >
          Identity
        </button>
        <button 
          onClick={() => setActiveTab('audio')}
          className={`w-full text-left px-4 py-3 border-l-2 text-sm font-bold transition-all royal-font tracking-wide ${activeTab === 'audio' ? 'border-[#D4AF37] bg-[#1a1a1a] text-[#F4C430]' : 'border-transparent text-[#8a7038] hover:text-[#D4AF37]'}`}
        >
          Resonance
        </button>
        
        <div className="mt-auto pt-6 border-t border-[#3d2b0f] space-y-2">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-between px-4 py-3 border border-[#3d2b0f] hover:border-red-900 text-red-800 hover:text-red-500 transition-all text-xs font-bold uppercase tracking-widest royal-font"
          >
            Abdicate
            {ICONS.LogOut}
          </button>
          <button 
            onClick={onClose}
            className="w-full flex items-center justify-between px-4 py-3 border border-[#3d2b0f] hover:border-[#8a7038] text-[#8a7038] hover:text-[#D4AF37] transition-all text-xs font-bold uppercase tracking-widest royal-font"
          >
            Return
            <span className="scale-75 opacity-50">ESC</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#050505] p-16 overflow-y-auto custom-scrollbar mandala-bg">
        <div className="max-w-3xl mx-auto">
          {activeTab === 'profile' && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
              <h1 className="text-3xl royal-font font-bold uppercase tracking-widest text-[#D4AF37]">Your Legacy</h1>
              
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

              <div className="bg-[#0a0a0a] border border-[#3d2b0f] overflow-hidden shadow-2xl">
                {/* Banner Preview/Edit */}
                <div className="h-32 bg-[#1a1a1a] relative border-b border-[#3d2b0f] group">
                   {/* Background Render */}
                   <div className="absolute inset-0 w-full h-full">
                     {editForm.banner && editForm.banner.startsWith('linear-gradient') ? (
                       <div className="w-full h-full" style={{ background: editForm.banner }} />
                     ) : editForm.banner ? (
                       <img src={editForm.banner} className="w-full h-full object-cover opacity-60" />
                     ) : (
                      <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20" />
                     )}
                   </div>
                   
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20">
                       <button onClick={rollBanner} className="flex items-center gap-2 text-[10px] font-bold uppercase text-[#D4AF37] royal-font border border-[#D4AF37] bg-black/80 px-4 py-2 hover:bg-[#D4AF37] hover:text-black transition-all">
                         <Dice5 size={14} /> Gamble Banner
                       </button>
                    </div>
                  )}
                </div>

                <div className="px-10 pb-10 flex flex-col gap-8 -mt-16 relative z-10">
                  <div className="flex items-end justify-between">
                    <div className="relative group">
                      <img src={editForm.avatar} className="w-32 h-32 rounded-full border-4 border-[#0a0a0a] shadow-2xl object-cover bg-black" />
                      <div className={`absolute bottom-2 right-2 w-8 h-8 rounded-full border-4 border-[#0a0a0a] ${statusColors[editForm.status]}`} />
                      
                      {isEditing && (
                        <div 
                          className="absolute inset-0 top-0 left-0 w-32 h-32 bg-black/60 rounded-full border-4 border-transparent flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all z-30"
                          onClick={() => fileInputRef.current?.click()}
                        >
                           <div className="flex flex-col items-center gap-1">
                             <Upload size={16} className="text-[#D4AF37]" />
                             <span className="text-[8px] font-bold uppercase text-[#D4AF37] royal-font">Upload</span>
                           </div>
                           <input 
                             type="file" 
                             ref={fileInputRef} 
                             className="hidden" 
                             accept="image/*" 
                             onChange={handleFileUpload}
                           />
                        </div>
                      )}
                    </div>
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className="px-6 py-2 border border-[#3d2b0f] text-[#8a7038] hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all text-xs font-bold uppercase tracking-widest royal-font">Rewrite History</button>
                    ) : (
                      <div className="flex gap-4">
                        <button onClick={handleCancel} className="px-6 py-2 text-[#5c4010] hover:text-[#8a7038] transition-all text-xs font-bold uppercase tracking-widest royal-font">Cancel</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-[#D4AF37] text-black font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all royal-font">Seal Changes</button>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-[#050505] p-8 border border-[#3d2b0f] space-y-8">
                    {/* Status Selection */}
                    {isEditing ? (
                      <div>
                         <label className="text-[10px] font-bold uppercase text-[#5c4010] tracking-widest block mb-3 royal-font">Presence</label>
                         <div className="flex gap-2 mb-4">
                           {(['online', 'idle', 'dnd', 'offline'] as const).map(s => (
                             <button
                               key={s}
                               onClick={() => setEditForm({ ...editForm, status: s })}
                               className={`flex-1 py-2 px-1 text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                                 editForm.status === s 
                                   ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#F4C430]' 
                                   : 'border-[#3d2b0f] text-[#5c4010] hover:border-[#8a7038]'
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
                           className="w-full bg-[#0a0a0a] border border-[#3d2b0f] p-3 text-[#F5F5DC] font-medium focus:outline-none focus:border-[#D4AF37] transition-all placeholder-[#3d2b0f] text-sm"
                         />
                      </div>
                    ) : (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#5c4010] tracking-widest block mb-2 royal-font">Presence</label>
                        <div className="flex items-center gap-3">
                           <div className={`w-3 h-3 rounded-full ${statusColors[user.status]}`} />
                           <span className="text-[#D4AF37] font-bold uppercase text-xs tracking-wide">
                             {user.status === 'offline' ? 'Invisible' : user.status}
                           </span>
                           {user.customStatus && (
                             <>
                               <span className="text-[#3d2b0f]">|</span>
                               <span className="text-[#8a7038] font-serif italic">"{user.customStatus}"</span>
                             </>
                           )}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#5c4010] tracking-widest block mb-2 royal-font">Title</label>
                      {isEditing ? (
                         <input 
                           type="text" 
                           value={editForm.username} 
                           onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                           className="w-full bg-[#0a0a0a] border border-[#3d2b0f] p-3 text-[#F5F5DC] font-medium focus:outline-none focus:border-[#D4AF37] transition-all"
                         />
                      ) : (
                        <div className="text-[#F5F5DC] font-serif text-lg">{user.username}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#5c4010] tracking-widest block mb-2 royal-font">Correspondence</label>
                      {isEditing ? (
                         <input 
                           type="email" 
                           value={editForm.email} 
                           onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                           className="w-full bg-[#0a0a0a] border border-[#3d2b0f] p-3 text-[#F5F5DC] font-medium focus:outline-none focus:border-[#D4AF37] transition-all"
                         />
                      ) : (
                        <div className="text-[#8a7038] font-serif">{user.email}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
             <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
               <h1 className="text-3xl royal-font font-bold uppercase tracking-widest text-[#D4AF37]">Acoustics</h1>
               
               <div className="space-y-6">
                 <div className="bg-[#0a0a0a] p-8 border border-[#3d2b0f]">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-[#F4C430] royal-font">Input Sensitivity</h3>
                     <span className="text-[10px] font-bold text-[#D4AF37] bg-[#1a1a1a] px-2 py-0.5 border border-[#3d2b0f]">{Math.round(noiseThreshold * 100)}%</span>
                   </div>
                   <MicVisualizer threshold={noiseThreshold} />
                   <input 
                     type="range" 
                     min="0" 
                     max="1" 
                     step="0.01" 
                     value={noiseThreshold}
                     onChange={(e) => onSettingsChange({ noiseThreshold: parseFloat(e.target.value) })}
                     className="w-full mt-6 h-1 bg-[#3d2b0f] rounded-none appearance-none cursor-pointer accent-[#D4AF37]"
                   />
                   <div className="flex justify-between text-[10px] text-[#5c4010] font-bold uppercase mt-2 royal-font">
                      <span>Low Threshold (Whisper)</span>
                      <span>High Threshold (Shout)</span>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-[#0a0a0a] p-6 border border-[#3d2b0f] hover:border-[#D4AF37] transition-all cursor-pointer group">
                      <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-3 group-hover:bg-[#D4AF37] group-hover:text-black transition-colors text-[#8a7038]">
                         {ICONS.Mic}
                      </div>
                      <h4 className="text-xs font-bold uppercase mb-2 text-[#E5C100] royal-font">Continuous</h4>
                      <p className="text-[10px] text-[#5c4010] font-medium">Your voice is transmitted constantly when sound is detected above the threshold.</p>
                    </div>
                    <div className="bg-[#0a0a0a] p-6 border border-[#3d2b0f] hover:border-[#D4AF37] transition-all cursor-pointer group">
                      <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-3 group-hover:bg-[#D4AF37] group-hover:text-black transition-colors text-[#8a7038]">
                         {ICONS.MicOff}
                      </div>
                      <h4 className="text-xs font-bold uppercase mb-2 text-[#E5C100] royal-font">Push to Talk</h4>
                      <p className="text-[10px] text-[#5c4010] font-medium">Microphone remains silenced until a binding key is pressed.</p>
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
