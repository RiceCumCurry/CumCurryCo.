
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { ICONS } from '../constants';
import MicVisualizer from './MicVisualizer';
import { Dice5, Upload, Link as LinkIcon, Search, X, Loader2, RotateCw, Palette } from 'lucide-react';

// --- Giphy Integration ---
// Multiple keys for fallback/redundancy
const GIPHY_KEYS = [
  '0UTRbFtkMxAplrog67DDmUH54pA', 
  'pLURtkhVrUXr3KG25Gy5JJAfhz5406mW', 
  'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh'
];

interface GiphyImage {
  id: string;
  images: {
    fixed_height: { url: string };
    original: { url: string };
  };
  title: string;
}

const GiphyPicker: React.FC<{ onClose: () => void; onSelect: (url: string) => void }> = ({ onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GiphyImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState<GiphyImage[]>([]);
  const [giphyError, setGiphyError] = useState<string | null>(null);

  const fetchGifs = async (searchTerm: string) => {
    setLoading(true);
    setGiphyError(null);
    let success = false;

    // Try keys sequentially until one works
    for (const key of GIPHY_KEYS) {
      try {
        const encoded = encodeURIComponent(searchTerm);
        const endpoint = searchTerm 
          ? `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encoded}&limit=20&rating=g`
          : `https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=20&rating=g`;
        
        const res = await fetch(endpoint);
        if (!res.ok) continue; // Try next key if HTTP error

        const data = await res.json();
        const gifs = Array.isArray(data.data) ? data.data : [];
        
        if (searchTerm) {
          setResults(gifs);
        } else {
          setTrending(gifs);
        }
        success = true;
        break; // Exit loop on success
      } catch (e) {
        console.warn(`Giphy key ${key} failed.`, e);
      }
    }

    if (!success) {
      if (searchTerm) setResults([]);
      else setTrending([]);
      setGiphyError("The archives are currently unreachable (Rate Limit).");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchGifs('');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGifs(query);
  };

  const displayGifs = (query ? results : trending) || [];

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-[#D4AF37] shadow-[0_0_50px_rgba(212,175,55,0.2)] flex flex-col h-[600px] relative">
        {/* Header */}
        <div className="p-4 border-b border-[#3d2b0f] flex justify-between items-center bg-[#050505]">
          <h3 className="text-[#D4AF37] royal-font font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="text-xl">🎞️</span> Giphy Portal
          </h3>
          <button onClick={onClose} className="text-[#5c4010] hover:text-[#D4AF37] transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 bg-[#0a0a0a]">
          <form onSubmit={handleSearch} className="relative group">
             <input 
               autoFocus
               type="text" 
               placeholder="Search the archives (e.g., 'Cyberpunk', 'Retro', 'Glitch')..." 
               className="w-full bg-[#050505] border border-[#3d2b0f] p-4 pl-12 text-[#F5F5DC] font-medium focus:outline-none focus:border-[#D4AF37] transition-all placeholder-[#3d2b0f] royal-font"
               value={query}
               onChange={(e) => setQuery(e.target.value)}
             />
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5c4010] group-focus-within:text-[#D4AF37] transition-colors" size={20} />
             <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D4AF37] text-xs font-bold uppercase tracking-widest hover:text-white">
               Search
             </button>
          </form>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#050505] mandala-bg">
          {loading ? (
             <div className="h-full flex items-center justify-center flex-col gap-4 text-[#8a7038]">
               <Loader2 className="animate-spin w-10 h-10 text-[#D4AF37]" />
               <span className="text-xs font-bold uppercase tracking-widest">Summoning Visuals...</span>
             </div>
          ) : giphyError ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
               <div className="text-red-500 font-bold uppercase tracking-widest text-xs royal-font">Connection Severed</div>
               <div className="text-[#8a7038] text-[10px] font-mono">{giphyError}</div>
               <button 
                 onClick={() => fetchGifs(query)}
                 className="flex items-center gap-2 px-6 py-2 border border-[#3d2b0f] hover:bg-[#1a1a1a] hover:text-[#D4AF37] text-[#8a7038] text-xs font-bold uppercase tracking-widest transition-all royal-font"
               >
                 <RotateCw size={14} /> Retry
               </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {displayGifs.map((gif) => (
                <button 
                  key={gif.id}
                  onClick={() => onSelect(gif.images.original.url)}
                  className="relative group aspect-square overflow-hidden border border-[#3d2b0f] hover:border-[#D4AF37] transition-all bg-[#1a1a1a]"
                >
                  <img 
                    src={gif.images.fixed_height.url} 
                    alt={gif.title} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[#D4AF37] font-bold text-xs uppercase tracking-widest border border-[#D4AF37] px-3 py-1 bg-black/80">Select</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {!loading && !giphyError && displayGifs.length === 0 && (
             <div className="text-center mt-20 opacity-50 text-[#8a7038] font-serif italic">
               No records found in the archives.
             </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-2 border-t border-[#3d2b0f] bg-[#050505] text-center">
          <img src="https://developers.giphy.com/branch/master/static/header-logo-0fec0225d189bc0eae27dac3e3770582.gif" className="h-6 mx-auto opacity-50 grayscale hover:grayscale-0 transition-all" alt="Powered by Giphy" />
        </div>
      </div>
    </div>
  );
};

// --- Theme Config ---
const THEMES = {
  royal: {
    name: 'Royal Court',
    border: '#D4AF37',
    accent: '#F4C430',
    shadow: 'rgba(212,175,55,0.4)',
    bg: '#000000'
  },
  cyberpunk: {
    name: 'Neon City',
    border: '#00ff9d',
    accent: '#ff00ff',
    shadow: 'rgba(0, 255, 157, 0.4)',
    bg: '#0a0a0a'
  },
  minimalist: {
    name: 'Void',
    border: '#525252',
    accent: '#e5e5e5',
    shadow: 'rgba(255, 255, 255, 0.1)',
    bg: '#171717'
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
    const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    const gradient = `linear-gradient(45deg, ${randomColor()}, ${randomColor()}, ${randomColor()})`;
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
    <div className="fixed inset-0 z-[200] bg-[#050505] flex animate-in fade-in zoom-in-95 duration-200">
      
      {showGiphyPicker && (
        <GiphyPicker 
          onClose={() => setShowGiphyPicker(false)} 
          onSelect={handleGiphySelect} 
        />
      )}

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

              <div 
                className="bg-[#0a0a0a] overflow-hidden shadow-2xl transition-colors duration-300"
                style={{ border: `1px solid ${currentTheme.border}` }}
              >
                {/* Banner Preview/Edit */}
                <div 
                  className="h-32 bg-[#1a1a1a] relative group transition-colors duration-300"
                  style={{ borderBottom: `1px solid ${currentTheme.border}` }}
                >
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
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 gap-3">
                       <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); bannerInputRef.current?.click(); }}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase text-[#D4AF37] royal-font border border-[#D4AF37] bg-black/50 px-3 py-1.5 hover:bg-[#D4AF37] hover:text-black transition-all"
                          >
                            <Upload size={14} /> Upload Img
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openGiphy('banner'); }}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase text-[#F4C430] royal-font border border-[#F4C430] bg-black/50 px-3 py-1.5 hover:bg-[#F4C430] hover:text-black transition-all"
                          >
                            <Search size={14} /> Giphy
                          </button>
                          <button 
                            onClick={rollBanner}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase text-[#D4AF37] royal-font border border-[#D4AF37] bg-black/50 px-3 py-1.5 hover:bg-[#D4AF37] hover:text-black transition-all"
                          >
                            <Dice5 size={14} /> Random
                          </button>
                       </div>
                       
                       <div className="flex items-center gap-2 w-72 bg-black/50 border border-[#3d2b0f] px-2 focus-within:border-[#D4AF37] transition-colors">
                          <LinkIcon size={12} className="text-[#8a7038] shrink-0" />
                          <input
                            type="text"
                            placeholder="Or paste URL..."
                            value={editForm.banner && !editForm.banner.startsWith('data:') && !editForm.banner.startsWith('linear-gradient') ? editForm.banner : ''}
                            onChange={(e) => setEditForm(prev => ({...prev, banner: e.target.value}))}
                            className="bg-transparent border-none text-[10px] text-[#F5F5DC] w-full py-2 focus:outline-none placeholder-[#5c4010]"
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
                             <Upload size={14} className="text-[#D4AF37] group-hover/btn:scale-110 transition-transform" />
                             <span className="text-[8px] font-bold uppercase text-[#D4AF37] royal-font">Img</span>
                           </button>
                           
                           <div className="w-8 h-[1px] bg-[#3d2b0f]" />
                           
                           <button 
                             onClick={() => openGiphy('avatar')}
                             className="flex flex-col items-center gap-1 group/btn"
                           >
                             <Search size={14} className="text-[#F4C430] group-hover/btn:scale-110 transition-transform" />
                             <span className="text-[8px] font-bold uppercase text-[#F4C430] royal-font">Gif</span>
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

                    {/* Theme Selection - Only visible when editing */}
                    {isEditing && (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#5c4010] tracking-widest block mb-3 royal-font">Visual Style</label>
                        <div className="grid grid-cols-3 gap-3">
                          {Object.entries(THEMES).map(([key, style]) => (
                            <button
                              key={key}
                              onClick={() => setEditForm(prev => ({ ...prev, profileTheme: key }))}
                              className="relative overflow-hidden group border transition-all duration-300 h-16 flex items-center justify-center"
                              style={{ 
                                borderColor: editForm.profileTheme === key ? style.border : '#3d2b0f',
                                backgroundColor: style.bg
                              }}
                            >
                                <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(45deg, ${style.border}, transparent)` }} />
                                <span 
                                  className="relative z-10 text-[10px] font-bold uppercase tracking-wider transition-colors"
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
