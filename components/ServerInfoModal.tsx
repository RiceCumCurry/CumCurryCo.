
import React, { useState } from 'react';
import { Server, User } from '../types';
import { ICONS } from '../constants';

interface ServerInfoModalProps {
  server: Server;
  members: User[];
  onClose: () => void;
}

const ServerInfoModal: React.FC<ServerInfoModalProps> = ({ server, members, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'roster'>('overview');
  
  const owner = members.find(m => m.id === server.ownerId);
  const roleCount = server.roles.length;
  const channelCount = server.channels.length;

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-[#0a0a0a] border border-[#5c4010] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Ornamental Corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37] z-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37] z-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37] z-20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37] z-20 pointer-events-none" />

        {/* Header Section */}
        <div className="h-40 shrink-0 bg-[#050505] relative group">
           {/* Banner Image */}
           <div className="absolute inset-0 overflow-hidden">
             {server.banner ? (
                <img 
                  src={server.banner} 
                  alt="Server Banner" 
                  className="w-full h-full object-cover opacity-80"
                />
             ) : (
                <div className="w-full h-full bg-[#1a1a1a] bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-50" />
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
           </div>
           
           <button 
             onClick={onClose} 
             className="absolute top-4 right-4 p-2 bg-black/50 text-[#D4AF37] hover:bg-black hover:text-[#F4C430] rounded-full transition-all z-30 border border-[#3d2b0f]"
           >
             {ICONS.X}
           </button>
           
           <div className="absolute -bottom-10 left-8 flex items-end gap-6 z-20">
              <div className="relative group/icon">
                <img 
                  src={server.icon} 
                  alt={server.name}
                  className="w-24 h-24 rounded-full border-4 border-[#0a0a0a] shadow-[0_0_20px_rgba(0,0,0,0.5)] object-cover bg-black" 
                />
                {/* Shine effect on icon */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover/icon:opacity-100 pointer-events-none transition-opacity" />
              </div>
              <div className="mb-12">
                <h2 className="text-3xl royal-font font-bold text-[#F4C430] uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none">
                  {server.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest drop-shadow-md">
                   <span>{members.length} Members</span>
                   <span>•</span>
                   <span>{server.theme || 'Royal'} Theme</span>
                </div>
              </div>
           </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-[#3d2b0f] pt-14 px-8 bg-[#0a0a0a] shrink-0">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest royal-font border-b-2 transition-all ${activeTab === 'overview' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-[#5c4010] hover:text-[#8a7038]'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest royal-font border-b-2 transition-all ${activeTab === 'roster' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-[#5c4010] hover:text-[#8a7038]'}`}
          >
            Roster
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-[#0a0a0a]">
          {activeTab === 'overview' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-8">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#5c4010] tracking-widest royal-font">Sovereign</span>
                  <div className="flex items-center gap-2">
                    <img src={owner?.avatar} className="w-6 h-6 rounded-full border border-[#3d2b0f] object-cover" />
                    <div className="text-[#D4AF37] font-bold text-sm royal-font">{owner?.username || 'System'}</div>
                    {owner?.id === server.ownerId && <span className="text-[#F4C430] text-[10px]">👑</span>}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#5c4010] tracking-widest royal-font">Established</span>
                  <div className="text-[#8a7038] font-bold text-sm font-serif">{new Date(server.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
              </div>

              <div className="h-[1px] bg-[#3d2b0f] mb-8 opacity-50" />

              <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                <div className="bg-[#050505] p-3 border border-[#3d2b0f] hover:border-[#5c4010] transition-colors group">
                  <span className="text-[9px] font-bold uppercase text-[#5c4010] tracking-widest block mb-1 royal-font group-hover:text-[#8a7038] transition-colors">Subjects</span>
                  <span className="text-[#D4AF37] font-serif text-xl">{members.length}</span>
                </div>
                <div className="bg-[#050505] p-3 border border-[#3d2b0f] hover:border-[#5c4010] transition-colors group">
                  <span className="text-[9px] font-bold uppercase text-[#5c4010] tracking-widest block mb-1 royal-font group-hover:text-[#8a7038] transition-colors">Ranks</span>
                  <span className="text-[#8a7038] font-serif text-xl group-hover:text-[#D4AF37] transition-colors">{roleCount}</span>
                </div>
                <div className="bg-[#050505] p-3 border border-[#3d2b0f] hover:border-[#5c4010] transition-colors group">
                  <span className="text-[9px] font-bold uppercase text-[#5c4010] tracking-widest block mb-1 royal-font group-hover:text-[#8a7038] transition-colors">Chambers</span>
                  <span className="text-[#8a7038] font-serif text-xl group-hover:text-[#D4AF37] transition-colors">{channelCount}</span>
                </div>
              </div>

              <div className="p-5 bg-[#050505] border border-[#3d2b0f] relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-2 opacity-10 text-[#D4AF37]">
                   <span className="text-5xl font-serif">❝</span>
                 </div>
                 <p className="text-[#8a7038] text-xs font-medium leading-relaxed italic font-serif relative z-10 text-center">
                   "A gathered alliance of {members.length} souls, forging their destiny within the {server.name} realm."
                 </p>
              </div>
            </div>
          )}

          {activeTab === 'roster' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-2">
               <div className="flex justify-between px-2 pb-2 border-b border-[#3d2b0f] text-[9px] font-bold uppercase text-[#5c4010] tracking-widest royal-font mb-2">
                 <span>Identity</span>
                 <span>Oath Sworn Date</span>
               </div>
               
               {members.map(member => {
                 const joinTimestamp = server.memberJoinedAt[member.id];
                 const joinDate = joinTimestamp ? new Date(joinTimestamp).toLocaleDateString() : 'Unknown';
                 const isOwner = member.id === server.ownerId;

                 return (
                   <div key={member.id} className="flex items-center justify-between p-2 hover:bg-[#1a1a1a] rounded transition-colors group border border-transparent hover:border-[#3d2b0f]">
                     <div className="flex items-center gap-3">
                       <div className="relative">
                         <img src={member.avatar} className="w-8 h-8 rounded-full border border-[#3d2b0f] group-hover:border-[#D4AF37] object-cover" />
                         <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] ${
                            member.status === 'online' ? 'bg-green-600' : 
                            member.status === 'idle' ? 'bg-yellow-600' : 
                            member.status === 'dnd' ? 'bg-red-600' : 'bg-gray-600'
                         }`} />
                       </div>
                       <div>
                         <div className="flex items-center gap-1">
                           <span className={`text-sm font-bold royal-font ${isOwner ? 'text-[#F4C430]' : 'text-[#8a7038] group-hover:text-[#E5C100]'}`}>
                             {member.username}
                           </span>
                           {isOwner && <span className="text-[10px]" title="Sovereign">👑</span>}
                         </div>
                         <div className="text-[9px] text-[#5c4010] uppercase tracking-wider">{isOwner ? 'Sovereign' : 'Subject'}</div>
                       </div>
                     </div>
                     <span className="text-xs text-[#5c4010] font-serif group-hover:text-[#8a7038]">{joinDate}</span>
                   </div>
                 );
               })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerInfoModal;
