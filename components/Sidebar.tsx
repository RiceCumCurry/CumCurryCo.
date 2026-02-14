
import React from 'react';
import { ICONS } from '../constants';
import { Server } from '../types';

interface SidebarProps {
  servers: Server[];
  activeServerId: string | null;
  onServerSelect: (id: string | null) => void;
  onAddServer: () => void;
  onExplore: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ servers, activeServerId, onServerSelect, onAddServer, onExplore }) => {
  return (
    <div className="w-[80px] pillar-texture flex flex-col items-center py-6 border-r-2 border-[#3d2b0f] relative z-20 h-full">
      {/* Decorative Top */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#996515] via-[#F4C430] to-[#996515]" />
      
      {/* Home / DM Medallion */}
      <div className="relative group mb-4 shrink-0">
        <button 
          onClick={() => onServerSelect(null)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
            activeServerId === null 
              ? 'border-[#F4C430] bg-black/50 shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
              : 'border-[#5c4010] bg-black/20 hover:border-[#D4AF37]'
          }`}
        >
          <span className={`${activeServerId === null ? 'text-[#F4C430]' : 'text-[#8a7038] group-hover:text-[#F4C430]'}`}>
            {ICONS.MessageSquare}
          </span>
        </button>
      </div>

      <div className="w-10 h-[1px] bg-[#3d2b0f] mb-4 shrink-0" />

      {/* Server Medallions */}
      <div className="flex-1 flex flex-col gap-4 w-full items-center overflow-y-auto no-scrollbar pb-4 min-h-0">
        {servers.map((server) => (
          <div key={server.id} className="relative group shrink-0">
            {activeServerId === server.id && (
               <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#F4C430] rounded-r-full shadow-[0_0_10px_#F4C430]" />
            )}
            <button
              onClick={() => onServerSelect(server.id)}
              className={`w-14 h-14 rounded-full p-1 transition-all duration-300 border-2 relative overflow-hidden ${
                activeServerId === server.id 
                  ? 'border-[#F4C430] shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
                  : 'border-[#5c4010] hover:border-[#D4AF37] hover:scale-105'
              }`}
            >
              <img 
                src={server.icon} 
                alt={server.name} 
                className="w-full h-full object-cover rounded-full"
              />
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] pointer-events-none" />
            </button>
            
            {/* Tooltip */}
            <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-3 py-1 bg-black border border-[#D4AF37] text-[#F4C430] text-xs rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none royal-font tracking-widest uppercase">
              {server.name}
            </div>
          </div>
        ))}

        {/* Action Buttons */}
        <button 
          onClick={onAddServer}
          className="w-12 h-12 mt-2 rounded-full border border-[#5c4010] border-dashed flex items-center justify-center text-[#5c4010] hover:text-[#F4C430] hover:border-[#F4C430] hover:border-solid transition-all duration-300 shrink-0"
        >
          {ICONS.Plus}
        </button>
        
        <button 
          onClick={onExplore}
          className="w-12 h-12 rounded-full border border-[#5c4010] border-dashed flex items-center justify-center text-[#5c4010] hover:text-[#F4C430] hover:border-[#F4C430] hover:border-solid transition-all duration-300 shrink-0"
        >
          {ICONS.Search}
        </button>
      </div>
      
      {/* Decorative Bottom */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-[#996515] via-[#F4C430] to-[#996515]" />
    </div>
  );
};

export default Sidebar;
