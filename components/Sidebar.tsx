
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
    <div className="w-[80px] pillar-texture flex flex-col items-center py-6 border-r-2 border-theme-border relative z-20 h-full">
      {/* Decorative Top */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-theme-gold-dark via-theme-gold-light to-theme-gold-dark" />
      
      {/* Home / DM Medallion */}
      <div className="relative group mb-4 shrink-0">
        <button 
          onClick={() => onServerSelect(null)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
            activeServerId === null 
              ? 'border-theme-gold-light bg-black/50 shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
              : 'border-theme-text-dim bg-black/20 hover:border-theme-gold'
          }`}
        >
          <span className={`${activeServerId === null ? 'text-theme-gold-light' : 'text-theme-text-muted group-hover:text-theme-gold-light'}`}>
            {ICONS.MessageSquare}
          </span>
        </button>
      </div>

      <div className="w-10 h-[1px] bg-theme-border mb-4 shrink-0" />

      {/* Server Medallions */}
      <div className="flex-1 flex flex-col gap-4 w-full items-center overflow-y-auto no-scrollbar pb-4 min-h-0">
        {servers.map((server) => (
          <div key={server.id} className="relative group shrink-0">
            {activeServerId === server.id && (
               <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-theme-gold-light rounded-r-full shadow-[0_0_10px_var(--gold-light)]" />
            )}
            <button
              onClick={() => onServerSelect(server.id)}
              className={`w-14 h-14 rounded-full p-1 transition-all duration-300 border-2 relative overflow-hidden ${
                activeServerId === server.id 
                  ? 'border-theme-gold-light shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
                  : 'border-theme-text-dim hover:border-theme-gold hover:scale-105'
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
            <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-3 py-1 bg-black border border-theme-gold text-theme-gold-light text-xs rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none royal-font tracking-widest uppercase">
              {server.name}
            </div>
          </div>
        ))}

        {/* Action Buttons */}
        <button 
          onClick={onAddServer}
          className="w-12 h-12 mt-2 rounded-full border border-theme-text-dim border-dashed flex items-center justify-center text-theme-text-dim hover:text-theme-gold-light hover:border-theme-gold-light hover:border-solid transition-all duration-300 shrink-0"
        >
          {ICONS.Plus}
        </button>
        
        <button 
          onClick={onExplore}
          className="w-12 h-12 rounded-full border border-theme-text-dim border-dashed flex items-center justify-center text-theme-text-dim hover:text-theme-gold-light hover:border-theme-gold-light hover:border-solid transition-all duration-300 shrink-0"
        >
          {ICONS.Search}
        </button>
      </div>
      
      {/* Decorative Bottom */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-theme-gold-dark via-theme-gold-light to-theme-gold-dark" />
    </div>
  );
};

export default Sidebar;
