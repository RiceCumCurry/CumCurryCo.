
import React, { useState } from 'react';
import { Server, User, ChannelType } from '../types';
import { ICONS } from '../constants';
import { SendHorizontal, X } from 'lucide-react';

interface ForwardModalProps {
  servers: Server[];
  friends: User[];
  messageContent: string;
  onClose: () => void;
  onForward: (targetId: string) => void;
}

const ForwardModal: React.FC<ForwardModalProps> = ({ servers, friends, messageContent, onClose, onForward }) => {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const handleForward = () => {
    if (selectedTarget) {
      onForward(selectedTarget);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0a0a0a] border border-[#5c4010] shadow-[0_0_50px_rgba(212,175,55,0.2)] flex flex-col h-[500px] relative">
        {/* Header */}
        <div className="p-4 border-b border-[#3d2b0f] flex justify-between items-center bg-[#050505]">
          <h3 className="text-[#D4AF37] royal-font font-bold uppercase tracking-widest text-sm">
            Forward Message
          </h3>
          <button onClick={onClose} className="text-[#5c4010] hover:text-[#D4AF37] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-4 bg-[#111] border-b border-[#3d2b0f] text-[#8a7038] text-xs italic truncate">
          "{messageContent}"
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-[#050505]">
          
          {/* Servers & Channels */}
          {servers.map(server => (
            <div key={server.id} className="mb-4">
              <div className="px-2 py-1 text-[10px] font-bold uppercase text-[#5c4010] tracking-widest royal-font mb-1 flex items-center gap-2">
                <img src={server.icon} className="w-4 h-4 rounded-full grayscale" />
                {server.name}
              </div>
              <div className="pl-2 space-y-1">
                {server.channels.filter(c => c.type === ChannelType.TEXT).map(channel => (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedTarget(channel.id)}
                    className={`w-full text-left px-3 py-2 rounded-sm text-xs font-bold transition-all flex items-center justify-between ${
                      selectedTarget === channel.id 
                        ? 'bg-[#D4AF37] text-black' 
                        : 'text-[#8a7038] hover:bg-[#1a1a1a] hover:text-[#D4AF37]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="opacity-50">#</span>
                      {channel.name}
                    </span>
                    {selectedTarget === channel.id && <SendHorizontal size={14} />}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* DMs */}
          <div className="mt-4">
            <div className="px-2 py-1 text-[10px] font-bold uppercase text-[#5c4010] tracking-widest royal-font mb-1">
              Direct Couriers
            </div>
            <div className="space-y-1">
              {friends.map(friend => {
                const dmId = `dm_${friend.id}`;
                return (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedTarget(dmId)}
                    className={`w-full text-left px-3 py-2 rounded-sm text-xs font-bold transition-all flex items-center justify-between ${
                      selectedTarget === dmId 
                        ? 'bg-[#D4AF37] text-black' 
                        : 'text-[#8a7038] hover:bg-[#1a1a1a] hover:text-[#D4AF37]'
                    }`}
                  >
                     <span className="flex items-center gap-2">
                      <img src={friend.avatar} className="w-5 h-5 rounded-full" />
                      {friend.username}
                    </span>
                    {selectedTarget === dmId && <SendHorizontal size={14} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#3d2b0f] bg-[#050505] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-[#5c4010] hover:text-[#8a7038] text-xs font-bold uppercase tracking-widest royal-font"
          >
            Cancel
          </button>
          <button 
            disabled={!selectedTarget}
            onClick={handleForward}
            className={`px-6 py-2 bg-[#D4AF37] text-black font-bold uppercase tracking-widest text-xs transition-all royal-font ${!selectedTarget ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}`}
          >
            Forward
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
