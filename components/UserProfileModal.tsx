
import React from 'react';
import { User } from '../types';
import { ICONS } from '../constants';

interface UserProfileModalProps {
  user: User;
  currentUser: User;
  isFriend: boolean;
  onClose: () => void;
  onAddFriend: () => void;
  onEditProfile: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  user, 
  currentUser, 
  isFriend, 
  onClose, 
  onAddFriend,
  onEditProfile 
}) => {
  const isSelf = user.id === currentUser.id;

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-[#0a0a0a] border border-[#5c4010] shadow-[0_0_60px_rgba(212,175,55,0.1)] relative overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="h-32 bg-[#1a1a1a] relative">
          <div className="absolute inset-0 w-full h-full">
            {user.banner && user.banner.startsWith('linear-gradient') ? (
              <div className="w-full h-full opacity-80" style={{ background: user.banner }} />
            ) : user.banner ? (
              <img src={user.banner} alt="Banner" className="w-full h-full object-cover opacity-80" />
            ) : (
              <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-50" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-black/50 text-[#D4AF37] hover:bg-black/80 rounded-full transition-all border border-[#3d2b0f] z-10"
          >
            {ICONS.X}
          </button>
        </div>

        {/* Avatar & Status - Overlapping Banner */}
        <div className="px-8 relative -mt-16 mb-4 flex justify-between items-end">
          <div className="relative group">
            <img 
              src={user.avatar} 
              alt={user.username} 
              className="w-32 h-32 rounded-full border-4 border-[#0a0a0a] shadow-2xl object-cover bg-black" 
            />
            <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-[#0a0a0a] ${
               user.status === 'online' ? 'bg-green-600' : 
               user.status === 'idle' ? 'bg-yellow-600' : 
               user.status === 'dnd' ? 'bg-red-600' : 'bg-gray-600'
            }`} title={user.status.toUpperCase()}></div>
          </div>
          
          <div className="mb-4 flex gap-2">
            {isSelf ? (
              <button 
                onClick={onEditProfile}
                className="px-4 py-2 bg-[#1a1a1a] border border-[#3d2b0f] text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all royal-font"
              >
                Edit Profile
              </button>
            ) : !isFriend ? (
              <button 
                onClick={onAddFriend}
                className="px-4 py-2 bg-[#D4AF37] text-black text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] royal-font flex items-center gap-2"
              >
                {ICONS.UserPlus}
                Add Ally
              </button>
            ) : (
               <div className="px-4 py-2 border border-[#3d2b0f] text-[#8a7038] text-[10px] font-bold uppercase tracking-widest royal-font cursor-default">
                 Ally
               </div>
            )}
          </div>
        </div>

        {/* Info Content */}
        <div className="px-8 pb-8 space-y-6">
          <div>
            <h2 className="text-2xl royal-font font-bold text-[#F4C430] uppercase tracking-wide">{user.username}</h2>
            <div className="flex items-center gap-2 mt-1">
               <p className="text-[#5c4010] font-bold text-xs uppercase tracking-[0.2em]">
                 #{user.id.substring(user.id.length - 4)}
               </p>
               {user.customStatus && (
                 <>
                    <span className="text-[#3d2b0f]">|</span>
                    <span className="text-[#8a7038] font-medium text-xs italic">{user.customStatus}</span>
                 </>
               )}
            </div>
          </div>

          <div className="h-[1px] bg-gradient-to-r from-transparent via-[#3d2b0f] to-transparent" />

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-[#050505] p-3 border border-[#3d2b0f]">
                <div className="text-[9px] font-bold uppercase text-[#5c4010] tracking-widest mb-1 royal-font">Status</div>
                <div className="text-[#D4AF37] text-sm font-medium capitalize">{user.status}</div>
             </div>
             <div className="bg-[#050505] p-3 border border-[#3d2b0f]">
                <div className="text-[9px] font-bold uppercase text-[#5c4010] tracking-widest mb-1 royal-font">Joined</div>
                <div className="text-[#8a7038] text-sm font-medium">Unknown Era</div>
             </div>
          </div>
          
          <div className="bg-[#050505] p-4 border border-[#3d2b0f] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-1 opacity-20">
               <span className="text-4xl">❝</span>
             </div>
             <p className="text-[#8a7038] text-xs italic font-serif leading-relaxed relative z-10">
               "A warrior of the realm, seeking glory in the digital colosseum."
             </p>
          </div>
        </div>

        {/* Decorative Bottom */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#996515] via-[#F4C430] to-[#996515]" />
      </div>
    </div>
  );
};

export default UserProfileModal;
