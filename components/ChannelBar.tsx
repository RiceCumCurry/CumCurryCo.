
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { Server, ChannelType, User } from '../types';
import MicVisualizer from './MicVisualizer';
import { Info, UserPlus } from 'lucide-react';

interface ChannelBarProps {
  server: Server | null;
  friends: User[];
  activeChannelId: string | null;
  currentUser: User | null;
  onChannelSelect: (id: string) => void;
  onCall: (type: 'VOICE' | 'VIDEO') => void;
  noiseThreshold: number;
  isMicMuted: boolean;
  ping: number;
  connectionStatus: 'stable' | 'lagging' | 'disconnected';
  onSettingsChange: (settings: { noiseThreshold?: number; isMicMuted?: boolean }) => void;
  onCreateChannel: (type: ChannelType) => void;
  onOpenSettings: () => void;
  onOpenServerInfo: () => void;
  onOpenUserSettings: () => void;
  onUpdateUser: (updates: Partial<User>) => Promise<boolean | string>;
  onAddFriend: () => void;
}

const ChannelBar: React.FC<ChannelBarProps> = ({ 
  server, 
  friends, 
  activeChannelId, 
  currentUser, 
  onChannelSelect,
  onCall,
  noiseThreshold,
  isMicMuted,
  ping,
  connectionStatus,
  onSettingsChange,
  onCreateChannel,
  onOpenSettings,
  onOpenServerInfo,
  onOpenUserSettings,
  onUpdateUser,
  onAddFriend
}) => {
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const isOwner = server?.ownerId === currentUser?.id;

  const handleStatusChange = (status: 'online' | 'idle' | 'dnd' | 'offline') => {
    onUpdateUser({ status });
    setShowStatusMenu(false);
  };

  const statusColors = {
    online: 'bg-green-600',
    idle: 'bg-yellow-600',
    dnd: 'bg-red-600',
    offline: 'bg-gray-600'
  };

  return (
    <div className="w-72 bg-theme-panel flex flex-col border-r border-theme-border shrink-0 select-none relative z-10">
       {/* Background Pattern Overlay */}
       <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, var(--gold-primary) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      {/* Header */}
      <div className="relative z-20">
        <div 
          className={`h-16 border-b border-theme-border flex items-center px-4 justify-between transition-all group shadow-lg bg-theme-panel`}
        >
          <div 
            onClick={() => setShowServerMenu(!showServerMenu)}
            className="flex-1 flex items-center justify-between cursor-pointer hover:bg-white/5 p-2 rounded mr-2 transition-colors"
          >
            <h2 className="royal-font font-bold text-theme-gold text-lg truncate tracking-wider">
              {server ? server.name : 'Sanctuary'}
            </h2>
            <span className={`text-theme-text-muted transition-all duration-300 ${showServerMenu ? 'rotate-180 text-theme-gold' : ''}`}>
              {ICONS.ChevronDown}
            </span>
          </div>

          {server && (
            <button 
              onClick={onOpenServerInfo}
              className="p-2 text-theme-text-dim hover:text-theme-gold hover:bg-white/5 rounded transition-all"
              title="Server Info"
            >
              <Info size={20} />
            </button>
          )}
        </div>

        {showServerMenu && server && (
          <div className="absolute top-full left-4 right-4 mt-2 z-50 bg-theme-panel border border-theme-text-dim rounded-none shadow-[0_0_30px_rgba(0,0,0,0.8)] p-1 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="border border-theme-border p-1">
                <button 
                onClick={() => { onOpenServerInfo(); setShowServerMenu(false); }}
                className="w-full flex items-center justify-between px-3 py-3 text-xs font-bold text-theme-text-muted hover:bg-white/5 hover:text-theme-gold transition-all royal-font tracking-widest uppercase"
                >
                Manifest
                <span className="opacity-50 text-[10px]">ℹ️</span>
                </button>
                {isOwner && (
                <button 
                    onClick={() => { onOpenSettings(); setShowServerMenu(false); }}
                    className="w-full flex items-center justify-between px-3 py-3 text-xs font-bold text-theme-gold-light hover:bg-white/5 hover:text-theme-text-highlight transition-all royal-font tracking-widest uppercase"
                >
                    Court Settings
                    {ICONS.Settings}
                </button>
                )}
                <button 
                onClick={() => { onCreateChannel(ChannelType.TEXT); setShowServerMenu(false); }}
                className="w-full flex items-center justify-between px-3 py-3 text-xs font-bold text-theme-text-muted hover:bg-white/5 hover:text-theme-gold transition-all royal-font tracking-widest uppercase"
                >
                New Chamber
                {ICONS.Plus}
                </button>
                <div className="h-[1px] bg-theme-border my-1 opacity-50" />
                <button className="w-full flex items-center justify-between px-3 py-3 text-xs font-bold text-red-900 hover:bg-red-900/10 hover:text-red-600 transition-all royal-font tracking-widest uppercase">
                Exile Self
                {ICONS.LogOut}
                </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar relative z-10">
        {server ? (
          <>
            <div className="mb-8">
              <div className="flex items-center text-theme-text-dim px-2 py-1 uppercase text-[10px] font-bold tracking-[0.2em] group cursor-default transition-colors border-b border-theme-border mb-2 royal-font">
                <span className="flex-1 group-hover:text-theme-text-muted">Scrolls</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onCreateChannel(ChannelType.TEXT); }}
                  className="hover:text-theme-gold-light transition-all"
                >
                  {ICONS.Plus}
                </button>
              </div>
              <div className="space-y-1 mt-2">
                {server.channels.filter(c => c.type === 'TEXT').map(channel => (
                  <button
                    key={channel.id}
                    onClick={() => onChannelSelect(channel.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-sm mb-1 group transition-all duration-300 ${
                      activeChannelId === channel.id 
                      ? 'bg-gradient-to-r from-white/10 to-transparent text-theme-gold border-l-2 border-theme-gold' 
                      : 'text-theme-text-muted/80 hover:text-theme-text-muted hover:bg-white/5'
                    }`}
                  >
                    <span className={`mr-3 font-serif text-lg leading-none ${activeChannelId === channel.id ? 'text-theme-gold-light' : 'text-theme-border group-hover:text-theme-text-muted'}`}>
                      ✦
                    </span>
                    <span className="text-sm font-medium truncate tracking-wide royal-font">{channel.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center text-theme-text-dim px-2 py-1 uppercase text-[10px] font-bold tracking-[0.2em] group cursor-default transition-colors border-b border-theme-border mb-2 royal-font">
                <span className="flex-1 group-hover:text-theme-text-muted">Ethereal</span>
                <button 
                   onClick={(e) => { e.stopPropagation(); onCreateChannel(ChannelType.VOICE); }}
                   className="hover:text-theme-gold-light transition-all"
                >
                    {ICONS.Plus}
                </button>
              </div>
              <div className="space-y-1 mt-2">
                {server.channels.filter(c => c.type !== 'TEXT').map(channel => (
                  <button
                    key={channel.id}
                    onClick={() => {
                        onChannelSelect(channel.id);
                        if (channel.type === 'VOICE' || channel.type === 'VIDEO') {
                            onCall(channel.type);
                        }
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-sm mb-1 group transition-all duration-300 ${
                        activeChannelId === channel.id 
                        ? 'bg-gradient-to-r from-white/10 to-transparent text-theme-gold border-l-2 border-theme-gold' 
                        : 'text-theme-text-muted/80 hover:text-theme-text-muted hover:bg-white/5'
                    }`}
                  >
                    <span className={`mr-3 transition-all scale-90 ${activeChannelId === channel.id ? 'text-theme-gold-light opacity-100' : 'opacity-50 group-hover:text-theme-gold group-hover:opacity-100'}`}>
                      {channel.type === 'VOICE' ? ICONS.Volume2 : ICONS.Video}
                    </span>
                    <span className="text-sm font-medium truncate tracking-wide royal-font">{channel.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <button className="w-full flex items-center px-3 py-3 text-theme-gold hover:bg-white/5 transition-all group mb-4 border border-theme-border bg-theme-bg">
              <span className="mr-3 text-theme-text-muted group-hover:text-theme-gold-light">{ICONS.Users}</span>
              <span className="text-[11px] font-bold uppercase tracking-widest royal-font">Allies</span>
            </button>
            <div className="pb-2 px-1 uppercase text-[10px] font-bold text-theme-text-dim tracking-widest border-b border-theme-border royal-font mb-4 flex justify-between items-center">
              <span>Direct Couriers</span>
              <button 
                onClick={onAddFriend} 
                className="hover:text-theme-gold transition-colors text-theme-text-dim"
                title="Add Ally"
              >
                <UserPlus size={14} />
              </button>
            </div>
            {friends.map(friend => {
              const dmId = `dm_${friend.id}`;
              const isActive = activeChannelId === dmId;
              
              return (
              <button 
                key={friend.id} 
                onClick={() => onChannelSelect(dmId)}
                className={`w-full flex items-center px-2 py-2 group hover:bg-white/5 transition-all mb-1 border-l-2 ${isActive ? 'bg-white/5 border-theme-gold' : 'border-transparent hover:border-theme-text-muted'}`}
              >
                <div className="relative">
                  <img src={friend.avatar} alt={friend.username} className="w-8 h-8 rounded-full object-cover border border-theme-border group-hover:border-theme-text-muted" />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-theme-panel ${
                    friend.status === 'online' ? 'bg-green-600' : 
                    friend.status === 'idle' ? 'bg-yellow-600' : 
                    friend.status === 'dnd' ? 'bg-red-600' : 'bg-gray-600'
                  }`} />
                </div>
                <div className="ml-3 flex-1 text-left overflow-hidden">
                  <div className={`text-[12px] font-bold truncate tracking-wide royal-font ${isActive ? 'text-theme-gold' : 'text-theme-text-muted group-hover:text-theme-gold'}`}>{friend.username}</div>
                  <div className="flex items-center gap-1.5 overflow-hidden">
                     <span className="text-[9px] text-theme-text-dim uppercase tracking-widest shrink-0">{friend.status === 'offline' ? 'Invisible' : friend.status}</span>
                     {friend.customStatus && (
                       <span className="text-[9px] text-theme-text-dim truncate italic border-l border-theme-border pl-1.5">{friend.customStatus}</span>
                     )}
                  </div>
                </div>
              </button>
            )})}
          </div>
        )}
      </div>

      {/* User Area */}
      <div className="bg-theme-bg p-3 border-t border-theme-border relative z-20">
        <div className="flex items-center gap-2 mb-3 px-1">
           {currentUser?.customStatus ? (
             <div className="flex items-center gap-2 overflow-hidden w-full">
               <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                 currentUser.status === 'online' ? 'bg-green-600' : 
                 currentUser.status === 'idle' ? 'bg-yellow-600' : 
                 currentUser.status === 'dnd' ? 'bg-red-600' : 'bg-gray-600'
               }`} />
               <span className="text-[9px] font-bold uppercase tracking-widest text-theme-text-muted royal-font truncate" title={currentUser.customStatus}>
                 {currentUser.customStatus}
               </span>
             </div>
           ) : (
             <>
               <div className={`w-1.5 h-1.5 rounded-full ${
                 connectionStatus === 'stable' ? 'bg-green-600' : connectionStatus === 'lagging' ? 'bg-yellow-600 animate-pulse' : 'bg-red-600'
               }`} />
               <span className="text-[9px] font-bold uppercase tracking-widest text-theme-text-dim royal-font">
                 Signal <span className="text-theme-border mx-1">|</span> {ping}ms
               </span>
             </>
           )}
        </div>

        <div className="flex flex-col gap-2 relative">
          {showAudioSettings && (
            <div className="absolute bottom-full left-0 w-full p-4 bg-theme-panel border border-theme-text-dim shadow-[0_0_40px_rgba(0,0,0,0.9)] z-50 animate-in fade-in slide-in-from-bottom-2 mb-2">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase text-theme-text-muted tracking-widest royal-font">Silence Gate</span>
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
                className="w-full mt-4 h-1 bg-theme-border rounded-none appearance-none cursor-pointer accent-theme-gold"
              />
            </div>
          )}
          
          {showStatusMenu && (
             <div className="absolute bottom-full left-0 w-full bg-theme-panel border border-theme-text-dim shadow-[0_0_40px_rgba(0,0,0,0.9)] z-50 animate-in fade-in slide-in-from-bottom-2 mb-2 p-2 flex flex-col gap-1">
                {(['online', 'idle', 'dnd', 'offline'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className="flex items-center gap-3 w-full p-2 hover:bg-white/10 transition-all group"
                  >
                    <div className={`w-2 h-2 rounded-full ${statusColors[s]}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-theme-text-muted group-hover:text-theme-gold royal-font">
                      {s === 'offline' ? 'Invisible' : s === 'idle' ? 'Idle / AFK' : s}
                    </span>
                  </button>
                ))}
                <div className="h-[1px] bg-theme-border my-1" />
                 <button 
                  onClick={() => { setShowStatusMenu(false); onOpenUserSettings(); }}
                  className="w-full text-center py-2 text-[9px] font-bold uppercase tracking-widest text-theme-text-dim hover:text-theme-gold royal-font"
                 >
                   Edit Profile
                 </button>
             </div>
          )}

          <div className="flex items-center gap-3">
            <div 
              className="relative group cursor-pointer shrink-0" 
              onClick={() => setShowStatusMenu(!showStatusMenu)}
            >
              <img 
                src={currentUser?.avatar || 'https://picsum.photos/seed/user/100/100'} 
                className="w-10 h-10 rounded-full ring-1 ring-theme-border group-hover:ring-theme-gold transition-all object-cover" 
              />
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-theme-bg ${
                 currentUser?.status === 'online' ? 'bg-green-600' : 
                 currentUser?.status === 'idle' ? 'bg-yellow-600' : 
                 currentUser?.status === 'dnd' ? 'bg-red-600' : 'bg-gray-600'
              }`} />
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowStatusMenu(!showStatusMenu)}>
              <div className="text-[12px] font-bold text-theme-text-highlight truncate leading-none uppercase tracking-wide royal-font mb-0.5">{currentUser?.username || 'Guest'}</div>
              <div className="text-[9px] text-theme-text-dim font-bold uppercase tracking-widest">
                {currentUser?.status === 'offline' ? 'Invisible' : currentUser?.status}
              </div>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => onSettingsChange({ isMicMuted: !isMicMuted })}
                onContextMenu={(e) => { e.preventDefault(); setShowAudioSettings(!showAudioSettings); }}
                className={`p-1.5 transition-all ${
                  isMicMuted ? 'text-red-500' : 'text-theme-text-dim hover:text-theme-gold'
                }`}
              >
                {isMicMuted ? ICONS.MicOff : ICONS.Mic}
              </button>
              <button 
                onClick={onOpenUserSettings}
                className="p-1.5 text-theme-text-dim hover:text-theme-gold transition-all"
              >
                {ICONS.Settings}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelBar;
