
import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { Message, User, Notification, Server, Role } from '../types';
import { SendHorizontal } from 'lucide-react';

interface ChatAreaProps {
  channelName: string;
  currentUser: User | null;
  messages: Message[];
  notifications: Notification[];
  allUsers: User[];
  server: Server | null;
  onSendMessage: (content: string) => void;
  onViewUser: (userId: string) => void;
  onAcceptFriendRequest: (userId: string, notificationId: string) => void;
  onRejectFriendRequest: (notificationId: string) => void;
}

const EMOJIS = ['⚔️', '🛡️', '🧙‍♂️', '🔥', '💀', '👑', '💎', '🩸', '📜', '⚜️', '🏰', '🐉'];

const ChatArea: React.FC<ChatAreaProps> = ({ 
  channelName, 
  currentUser, 
  messages, 
  notifications,
  allUsers,
  server,
  onSendMessage,
  onViewUser,
  onAcceptFriendRequest,
  onRejectFriendRequest
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, channelName]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
    setShowEmojiPicker(false);
    setMentionQuery(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Mention detection
    const lastWord = value.split(/\s+/).pop() || '';
    if (lastWord.startsWith('@')) {
        setMentionQuery(lastWord.substring(1).toLowerCase());
    } else {
        setMentionQuery(null);
    }
  };

  const insertMention = (username: string) => {
      const words = inputValue.split(/\s+/);
      words.pop(); // Remove the incomplete mention
      const newValue = [...words, `@${username} `].join(' ');
      setInputValue(newValue);
      setMentionQuery(null);
      inputRef.current?.focus();
  };

  const getHighestRole = (userId: string): Role | null => {
    if (!server) return null;
    const roleIds = server.memberRoles[userId] || [];
    if (roleIds.length === 0) return null;

    // Find all roles and sort by index in server.roles (lower index = higher priority)
    const userRoles = roleIds
      .map(id => server.roles.find(r => r.id === id))
      .filter((r): r is Role => !!r)
      .sort((a, b) => {
        const indexA = server.roles.indexOf(a);
        const indexB = server.roles.indexOf(b);
        return indexA - indexB;
      });

    return userRoles[0] || null;
  };

  const filteredUsers = mentionQuery !== null 
    ? allUsers.filter(u => u.username.toLowerCase().includes(mentionQuery))
    : [];
  
  const showEveryoneOption = mentionQuery !== null && 'everyone'.includes(mentionQuery);

  const renderMessageContent = (content: string) => {
    return content.split(/(\s+)/).map((word, i) => {
        if (word === '@everyone') {
            return <span key={i} className="bg-[#D4AF37]/20 text-[#D4AF37] px-1 rounded font-bold cursor-default">@everyone</span>;
        }
        if (word.startsWith('@')) {
            const username = word.substring(1);
            const user = allUsers.find(u => u.username === username);
            if (user) {
                return (
                    <span 
                        key={i} 
                        className="text-[#F4C430] bg-[#F4C430]/10 px-1 rounded font-bold cursor-pointer hover:underline hover:bg-[#F4C430]/20 transition-all" 
                        onClick={() => onViewUser(user.id)}
                    >
                        {word}
                    </span>
                );
            }
        }
        return word;
    });
  };

  // Group Members Logic
  const memberGroups = React.useMemo(() => {
    if (!server) return [];
    
    // Sort roles by priority
    const sortedRoles = [...server.roles]; // Assuming order in array is priority
    
    const groups: { role: Role | null, members: User[] }[] = [];
    const membersWithRole = new Set<string>();

    sortedRoles.forEach(role => {
        const roleMembers = allUsers.filter(u => {
             // Check if user is in server
             if (!server.memberJoinedAt[u.id]) return false;
             // Check if this is their highest role
             const highest = getHighestRole(u.id);
             return highest?.id === role.id;
        });

        if (roleMembers.length > 0) {
            groups.push({ role, members: roleMembers });
            roleMembers.forEach(m => membersWithRole.add(m.id));
        }
    });

    // Members without roles
    const noRoleMembers = allUsers.filter(u => 
        server.memberJoinedAt[u.id] && !membersWithRole.has(u.id)
    );

    if (noRoleMembers.length > 0) {
        groups.push({ role: null, members: noRoleMembers });
    }

    return groups;
  }, [server, allUsers]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden mandala-bg min-w-0">
        {/* Top Header */}
        <div className="h-16 border-b border-[#3d2b0f] flex items-center px-8 justify-between bg-[#050505]/80 backdrop-blur-md sticky top-0 z-20 shadow-xl shrink-0">
            <div className="flex items-center gap-4">
            <span className="text-[#8a7038] font-serif text-2xl">✦</span>
            <div className="flex flex-col">
                <span className="royal-font font-bold text-[#D4AF37] uppercase tracking-widest text-lg">{channelName}</span>
                <span className="text-[9px] text-[#5c4010] uppercase tracking-[0.2em] font-bold">Chamber of Discourse</span>
            </div>
            </div>
            <div className="flex items-center gap-6 text-[#5c4010]">
            
            {/* Notifications */}
            <div className="relative">
                <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`hover:text-[#D4AF37] transition-colors relative ${showNotifications ? 'text-[#D4AF37]' : ''}`}
                >
                {ICONS.Bell}
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full border border-black animate-pulse" />
                )}
                </button>
                
                {showNotifications && (
                <div className="absolute right-0 top-full mt-4 w-80 bg-[#0a0a0a] border border-[#5c4010] shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-[#3d2b0f] text-xs font-bold uppercase tracking-widest text-[#8a7038] bg-[#050505] royal-font">
                    Decrees & Summons
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="p-6 text-center text-[10px] text-[#5c4010] font-medium italic">
                        No new correspondence.
                        </div>
                    ) : (
                        notifications.map(notif => (
                        <div key={notif.id} className="p-4 border-b border-[#3d2b0f] hover:bg-[#111] transition-colors">
                            <div className="text-[#E5C100] text-xs mb-1 font-bold royal-font">
                            {notif.type === 'FRIEND_REQUEST' ? 'Alliance Proposal' : notif.type === 'MENTION' ? 'You were Summoned' : 'System Decree'}
                            </div>
                            <p className="text-[#8a7038] text-[11px] mb-3">{notif.content}</p>
                            
                            {notif.type === 'FRIEND_REQUEST' && notif.fromUserId && (
                            <div className="flex gap-2">
                                <button 
                                onClick={() => onAcceptFriendRequest(notif.fromUserId!, notif.id)}
                                className="flex-1 bg-[#1a1a1a] border border-[#3d2b0f] hover:border-[#D4AF37] hover:text-[#D4AF37] text-[#5c4010] text-[9px] font-bold uppercase tracking-widest py-1 flex items-center justify-center gap-1 transition-all"
                                >
                                {ICONS.Check} Accept
                                </button>
                                <button 
                                onClick={() => onRejectFriendRequest(notif.id)}
                                className="flex-1 bg-[#1a1a1a] border border-[#3d2b0f] hover:border-red-900 hover:text-red-600 text-[#5c4010] text-[9px] font-bold uppercase tracking-widest py-1 flex items-center justify-center gap-1 transition-all"
                                >
                                {ICONS.X} Deny
                                </button>
                            </div>
                            )}
                        </div>
                        ))
                    )}
                    </div>
                </div>
                )}
            </div>

            <button 
               onClick={() => setShowMembers(!showMembers)}
               className={`hover:text-[#D4AF37] transition-colors ${showMembers ? 'text-[#D4AF37]' : ''}`}
            >
                {ICONS.Users}
            </button>
            <div className="w-[1px] h-6 bg-[#3d2b0f]" />
            <button className="hover:text-[#D4AF37] transition-colors">{ICONS.Settings}</button>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar" ref={scrollRef}>
            <div className="py-16 px-10 border-b border-[#3d2b0f] mb-10 max-w-4xl mx-auto text-center ornate-divider">
            <div>
                <div className="w-20 h-20 rounded-full border border-[#D4AF37] flex items-center justify-center mx-auto mb-6 bg-black shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                    <span className="text-3xl text-[#D4AF37]">✦</span>
                </div>
                <h1 className="text-4xl royal-font font-bold text-[#D4AF37] mb-2 uppercase tracking-widest">Welcome to {channelName}</h1>
                <p className="text-[#8a7038] font-medium text-sm tracking-wide">The archives of this conversation begin here.</p>
            </div>
            </div>

            {messages.map((msg) => {
            const senderRole = getHighestRole(msg.userId);
            const isMention = msg.content.includes(`@${currentUser?.username}`) || msg.content.includes('@everyone');
            
            return (
                <div key={msg.id} className={`flex gap-6 group px-4 py-2 transition-all rounded-lg border border-transparent hover:border-[#3d2b0f] ${isMention ? 'bg-[#D4AF37]/10 border-l-2 border-l-[#D4AF37]' : 'hover:bg-[#D4AF37]/5'}`}>
                <div 
                    className="shrink-0 pt-1 cursor-pointer"
                    onClick={() => onViewUser(msg.userId)}
                >
                    <img 
                    src={allUsers.find(u => u.id === msg.userId)?.avatar || `https://picsum.photos/seed/${msg.userId}/100/100`}
                    className="w-12 h-12 rounded-full ring-2 ring-[#3d2b0f] group-hover:ring-[#D4AF37] transition-all object-cover shadow-lg" 
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span 
                        onClick={() => onViewUser(msg.userId)}
                        className="royal-font font-bold text-[#E5C100] hover:underline cursor-pointer uppercase text-xs tracking-wider"
                    >
                        {allUsers.find(u => u.id === msg.userId)?.username || 'Unknown Noble'}
                    </span>
                    
                    {senderRole && (
                        <span 
                        className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-sm"
                        style={{ 
                            color: senderRole.color, 
                            borderColor: senderRole.color,
                            backgroundColor: `${senderRole.color}15`
                        }}
                        >
                        {senderRole.name}
                        </span>
                    )}

                    <span className="text-[10px] text-[#5c4010] font-bold uppercase tracking-widest mt-0.5">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    </div>
                    <p className="text-[#e0d6c2] leading-relaxed font-light text-[15px] font-sans tracking-wide">
                        {renderMessageContent(msg.content)}
                    </p>
                </div>
                </div>
            );
            })}
            <div className="h-4" />
        </div>

        {/* Input */}
        <div className="px-8 pb-8 pt-4 bg-gradient-to-t from-[#050505] to-transparent relative shrink-0">
            {/* Mention Autocomplete */}
            {mentionQuery !== null && (filteredUsers.length > 0 || showEveryoneOption) && (
                <div className="absolute bottom-24 left-16 bg-[#0a0a0a] border border-[#5c4010] shadow-2xl z-50 rounded min-w-[200px] overflow-hidden">
                    <div className="p-2 bg-[#1a1a1a] text-[10px] font-bold uppercase tracking-widest text-[#8a7038] border-b border-[#3d2b0f]">
                        Summoning
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                        {showEveryoneOption && (
                            <button 
                                onClick={() => insertMention('everyone')}
                                className="w-full text-left px-3 py-2 hover:bg-[#D4AF37]/20 text-[#D4AF37] font-bold text-xs flex items-center gap-2"
                            >
                                <span>@</span> everyone
                            </button>
                        )}
                        {filteredUsers.map(user => (
                            <button 
                                key={user.id}
                                onClick={() => insertMention(user.username)}
                                className="w-full text-left px-3 py-2 hover:bg-[#1a1a1a] flex items-center gap-2 group"
                            >
                                <img src={user.avatar} className="w-5 h-5 rounded-full" />
                                <span className="text-[#F5F5DC] group-hover:text-[#D4AF37] font-medium text-xs">{user.username}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {showEmojiPicker && (
            <div className="absolute bottom-24 right-12 bg-[#0a0a0a] border border-[#3d2b0f] p-2 grid grid-cols-4 gap-2 shadow-2xl z-50">
                {EMOJIS.map(emoji => (
                <button 
                    key={emoji} 
                    onClick={() => setInputValue(prev => prev + emoji)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-[#1a1a1a] rounded text-xl"
                >
                    {emoji}
                </button>
                ))}
            </div>
            )}

            <div className="bg-[#0a0a0a] rounded-none border border-[#3d2b0f] flex items-center px-4 py-3 gap-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] focus-within:border-[#8a7038] transition-all relative">
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#D4AF37]" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#D4AF37]" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#D4AF37]" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#D4AF37]" />

            <button className="w-8 h-8 flex items-center justify-center text-[#5c4010] hover:text-[#D4AF37] transition-all">
                {ICONS.Plus}
            </button>
            <input
                ref={inputRef}
                type="text"
                placeholder={`Inscribe upon #${channelName}...`}
                className="flex-1 bg-transparent border-none outline-none text-[#F5F5DC] placeholder-[#3d2b0f] font-medium text-[15px] royal-font"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <div className="flex gap-4 items-center">
                <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="cursor-pointer opacity-50 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                >
                📜
                </button>
                <button 
                onClick={handleSend}
                className="w-8 h-8 flex items-center justify-center text-[#D4AF37] hover:scale-110 transition-transform"
                >
                <SendHorizontal size={20} />
                </button>
            </div>
            </div>
        </div>
        </div>

        {/* Member List Sidebar */}
        {showMembers && (
            <div className="w-64 bg-[#080808] border-l border-[#3d2b0f] flex flex-col shrink-0 animate-in slide-in-from-right-10 duration-200 shadow-xl z-20">
                <div className="p-4 border-b border-[#3d2b0f] bg-[#050505]">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] royal-font">
                        Subjects - {server?.memberRoles ? Object.keys(server.memberRoles).length : 0}
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
                    {memberGroups.map((group, idx) => (
                        <div key={group.role?.id || 'norole' + idx}>
                             <div className="text-[10px] font-bold uppercase text-[#5c4010] tracking-[0.2em] mb-2 px-2 royal-font">
                                {group.role ? group.role.name : 'Subjects'}
                             </div>
                             <div className="space-y-1">
                                {group.members.map(member => (
                                    <button 
                                      key={member.id} 
                                      onClick={() => onViewUser(member.id)}
                                      className="w-full flex items-center p-2 rounded hover:bg-[#1a1a1a] group transition-all"
                                    >
                                        <div className="relative shrink-0">
                                            <img src={member.avatar} className="w-8 h-8 rounded-full border border-[#3d2b0f] group-hover:border-[#D4AF37] object-cover" />
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] ${
                                                member.status === 'online' ? 'bg-green-600' : 
                                                member.status === 'idle' ? 'bg-yellow-600' : 
                                                member.status === 'dnd' ? 'bg-red-600' : 'bg-gray-600'
                                            }`} />
                                        </div>
                                        <div className="ml-3 text-left overflow-hidden">
                                            <div className={`text-sm font-bold truncate royal-font ${group.role ? '' : 'text-[#8a7038]'}`} style={{ color: group.role?.color }}>
                                                {member.username}
                                            </div>
                                            {member.customStatus && (
                                                <div className="text-[9px] text-[#5c4010] truncate italic">{member.customStatus}</div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default ChatArea;
