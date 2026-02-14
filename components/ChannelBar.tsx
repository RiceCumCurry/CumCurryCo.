
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { Server, ChannelType, User } from '../types';
import MicVisualizer from './MicVisualizer';
import { Info } from 'lucide-react';

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
  onCreateChannel: () => void;
  onOpenSettings: () => void;
  onOpenServerInfo: () => void;
  onOpenUserSettings: () => void;
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
  onOpenUserSettings
}) => {
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);

  const isOwner = server?.ownerId === currentUser?.id;

  return (
    <div className="w-72 bg-[#080808] flex flex-col border-r border-[#3d2b0f] shrink-0 select-none relative z-10">
       {/* Background Pattern Overlay */}
       <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      {/* Header */}
      <div className="relative z-20">
        <div 
          className={`h-16 border-b border-[#3d2b0f] flex items-center px-4 justify-between transition-all group shadow-lg bg-[#080808]`}
        >
          <div 
            onClick={() => setShowServerMenu(!showServerMenu)}
            className="flex-1 flex items-center justify-between cursor-pointer hover:bg-[#111] p-2 rounded mr-2 transition-colors"
          >
            <h2 className="royal-font font-bold text-[#D4AF37] text-lg truncate tracking-wider">
              {server ? server.name : 'Sanctuary'}
            </h2>
            <span className={`text-[#8a7038] transition-all duration-300 ${showServerMenu ? 'rotate-180 text-[#D4AF37]' : ''}`}>
              {ICONS.ChevronDown}
            </span>
          </div>

          {server && (
            <button 
              onClick={onOpenServerInfo}
              className="p-2 text-[#5c4010] hover:text-[#D4AF37] hover:bg-[#111] rounded transition-all"
              title="Server Info"
            >
              <Info size={20} />
            </button>
          )}
        </div>

        {showServerMenu && server && (
          <div className="absolute top-full left-4 right-4 mt-2 z-50 bg-[#0a0a0a] border border-[#5c4010] rounded-none shadow-[0_0_30px_rgba(0,0,0,0.8)] p-1 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="border border-[#3d2b0f] p-1">
                <button 
                onClick={() => { onOpenServerInfo(); setShowServerMenu(false); }}
                className="w-full flex items-center justify-between px-3 py-3 text-xs font-bold text-[#8a7038] hover:bg-[#1a1a1a] hover:text-[#D4AF37] transition-all royal-font tracking-widest uppercase"
                >
                Manifest
                <span className="opacity-50 text-[10px]">ℹ️</span>
                </button>
                {isOwner && (
                <button 
                    onClick={() => { onOpenSettings(); setShowServerMenu(false); }}
                    className="w-full flex items-center justify-between px-3 py-3 text-xs font-bold text-[#F4C430] hover:bg-[#1a1a1a] hover:text-[#FFD700] transition-all royal-font tracking-widest uppercase"
                >
                    Court Settings
                    {ICONS.Settings}
                </button>
                )}
                <button 
                onClick={() => { onCreateChannel(); setShowServerMenu(false); }}
                className="w-full flex items-center justify-between px-3 py-3 text-xs font-bold text-[#8a7038] hover:bg-[#1a1a1a] hover:text-[#D4AF37] transition-all royal-font tracking-widest uppercase"
                >
                New Chamber
                {ICONS.Plus}
                </button>
                <div className="h-[1px] bg-[#3d2b0f] my-1 opacity-50" />
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
              <div className="flex items-center text-[#5c4010] px-2 py-1 uppercase text-[10px] font-bold tracking-[0.2em] group cursor-default transition-colors border-b border-[#3d2b0f] mb-2 royal-font">
                <span className="flex-1 group-hover:text-[#8a7038]">Scrolls</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onCreateChannel(); }}
                  className="hover:text-[#F4C430] transition-all"
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
                      ? 'bg-gradient-to-r from-[#1a1a1a] to-transparent text-[#D4AF37] border-l-2 border-[#D4AF37]' 
                      : 'text-[#6b5835] hover:text-[#a88f55] hover:bg-[#111]'
                    }`}
                  >
                    <span className={`mr-3 font-serif text-lg leading-none ${activeChannelId === channel.id ? 'text-[#F4C430]' : 'text-[#3d2b0f] group-hover:text-[#6b5835]'}`}>
                      ✦
                    </span>
                    <span className="text-sm font-medium truncate tracking-wide royal-font">{channel.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center text-[#5c4010] px-2 py-1 uppercase text-[10px] font-bold tracking-[0.2em] group cursor-default transition-colors border-b border-[#3d2b0f] mb-2 royal-font">
                <span className="flex-1 group-hover:text-[#8a7038]">Ethereal</span>
                <button className="hover:text-[#F4C430] transition-all">{ICONS.Plus}</button>
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
                        ? 'bg-gradient-to-r from-[#1a1a1a] to-transparent text-[#D4AF37] border-l-2 border-[#D4AF37]' 
                        : 'text-[#6b5835] hover:text-[#a88f55] hover:bg-[#111]'
                    }`}
                  >
                    <span className={`mr-3 transition-all scale-90 ${activeChannelId === channel.id ? 'text-[#F4C430] opacity-100' : 'opacity-50 group-hover:text-[#D4AF37] group-hover:opacity-100'}`}>
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
            <button className="w-full flex items-center px-3 py-3 text-[#D4AF37] hover:bg-[#111] transition-all group mb-4 border border-[#3d2b0f] bg-[#0c0c0c]">
              <span className="mr-3 text-[#8a7038] group-hover:text-[#F4C430]">{ICONS.Users}</span>
              <span className="text-[11px] font-bold uppercase tracking-widest royal-font">Allies</span>
            </button>
            <div className="pb-2 px-1 uppercase text-[10px] font-bold text-[#5c4010] tracking-widest border-b border-[#3d2b0f] royal-font mb-4">
              Direct Couriers
            </div>
            {friends.map(friend => (
              <button key={friend.id} className="w-full flex items-center px-2 py-2 group hover:bg-[#111] transition-all mb-1 border-l-2 border-transparent hover:border-[#8a7038]">
                <div className="relative">
                  <img src={friend.avatar} alt={friend.username} className="w-8 h-8 rounded-full object-cover border border-[#3d2b0f] group-hover:border-[#8a7038]" />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080808] ${
                    friend.status === 'online' ? 'bg-green-600' : 
                    friend.status === 'idle' ? 'bg-yellow-600' : 
                    friend.status === 'dnd' ? 'bg-red-600' : 'bg-gray-600'
                  }`} />
                </div>
                <div className="ml-3 flex-1 text-left overflow-hidden">
                  <div className="text-[12px] font-bold text-[#8a7038] group-hover:text-[#D4AF37] truncate tracking-wide royal-font">{friend.username}</div>
                  <div className="flex items-center gap-1.5 overflow-hidden">
                     <span className="text-[9px] text-[#5c4010] uppercase tracking-widest shrink-0">{friend.status === 'offline' ? 'Invisible' : friend.status}</span>
                     {friend.customStatus && (
                       <span className="text-[9px] text-[#5c4010] truncate italic border-l border-[#3d2b0f] pl-1.5">{friend.customStatus}</span>
                     )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Area */}
      <div className="bg-[#050505] p-3 border-t border-[#3d2b0f] relative z-20">
        <div className="flex items-center gap-2 mb-3 px-1">
           {currentUser?.customStatus ? (
             <div className="flex items-center gap-2 overflow-hidden w-full">
               <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                 currentUser.status === 'online' ? 'bg-green-600' : 
                 currentUser.status === 'idle' ? 'bg-yellow-600' : 
                 currentUser.status === 'dnd' ? 'bg-red-600' : 'bg-gray-600'
               }`} />
               <span className="text-[9px] font-bold uppercase tracking-widest text-[#8a7038] royal-font truncate" title={currentUser.customStatus}>
                 {currentUser.customStatus}
               </span>
             </div>
           ) : (
             <>
               <div className={`w-1.5 h-1.5 rounded-full ${
                 connectionStatus === 'stable' ? 'bg-green-600' : connectionStatus === 'lagging' ? 'bg-yellow-600 animate-pulse' : 'bg-red-600'
               }`} />
               <span className="text-[9px] font-bold uppercase tracking-widest text-[#5c4010] royal-font">
                 Signal <span className="text-[#3d2b0f] mx-1">|</span> {ping}ms
               </span>
             </>
           )}
        </div>

        <div className="flex flex-col gap-2 relative">
          {showAudioSettings && (
            <div className="absolute bottom-full left-0 w-full p-4 bg-[#0a0a0a] border border-[#5c4010] shadow-[0_0_40px_rgba(0,0,0,0.9)] z-50 animate-in fade-in slide-in-from-bottom-2 mb-2">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase text-[#8a7038] tracking-widest royal-font">Silence Gate</span>
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
                className="w-full mt-4 h-1 bg-[#3d2b0f] rounded-none appearance-none cursor-pointer accent-[#D4AF37]"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer shrink-0" onClick={onOpenUserSettings}>
              <img 
                src={currentUser?.avatar || 'https://picsum.photos/seed/user/100/100'} 
                className="w-10 h-10 rounded-full ring-1 ring-[#3d2b0f] group-hover:ring-[#D4AF37] transition-all object-cover" 
              />
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#050505] ${
                 currentUser?.status === 'online' ? 'bg-green-600' : 
                 currentUser?.status === 'idle' ? 'bg-yellow-600' : 
                 currentUser?.status === 'dnd' ? 'bg-red-600' : 'bg-gray-600'
              }`} />
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpenUserSettings}>
              <div className="text-[12px] font-bold text-[#E5C100] truncate leading-none uppercase tracking-wide royal-font mb-0.5">{currentUser?.username || 'Guest'}</div>
              <div className="text-[9px] text-[#5c4010] font-bold uppercase tracking-widest">
                {currentUser?.status === 'offline' ? 'Invisible' : currentUser?.status}
              </div>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => onSettingsChange({ isMicMuted: !isMicMuted })}
                onContextMenu={(e) => { e.preventDefault(); setShowAudioSettings(!showAudioSettings); }}
                className={`p-1.5 transition-all ${
                  isMicMuted ? 'text-red-500' : 'text-[#5c4010] hover:text-[#D4AF37]'
                }`}
              >
                {isMicMuted ? ICONS.MicOff : ICONS.Mic}
              </button>
              <button 
                onClick={onOpenUserSettings}
                className="p-1.5 text-[#5c4010] hover:text-[#D4AF37] transition-all"
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
