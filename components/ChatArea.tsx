
import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { Message, User, Notification, Server, Role } from '../types';
import { SendHorizontal, Reply, Trash2, Copy, Forward, X, SmilePlus } from 'lucide-react';
import ForwardModal from './ForwardModal';

interface ChatAreaProps {
  channelName: string;
  currentUser: User | null;
  messages: Message[];
  notifications: Notification[];
  allUsers: User[];
  server: Server | null;
  servers: Server[]; // Added to support forwarding
  friends: User[]; // Added to support forwarding
  isDM?: boolean;
  onSendMessage: (content: string, replyToId?: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onForwardMessage: (targetId: string, content: string) => void;
  onViewUser: (userId: string) => void;
  onAcceptFriendRequest: (userId: string, notificationId: string) => void;
  onRejectFriendRequest: (notificationId: string) => void;
  onCall?: (type: 'VOICE' | 'VIDEO') => void;
  onAddReaction: (messageId: string, emoji: string) => void;
}

const EMOJIS = ['⚔️', '🛡️', '🧙‍♂️', '🔥', '💀', '👑', '💎', '🩸', '📜', '⚜️', '🏰', '🐉', '👍', '👎', '❤️', '😂'];

const ChatArea: React.FC<ChatAreaProps> = ({ 
  channelName, 
  currentUser, 
  messages, 
  notifications,
  allUsers,
  server,
  servers,
  friends,
  isDM = false,
  onSendMessage,
  onDeleteMessage,
  onForwardMessage,
  onViewUser,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onCall,
  onAddReaction
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  
  // Action States
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [reactingToMessageId, setReactingToMessageId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, channelName]);

  useEffect(() => {
    // Focus input when replying
    if (replyingTo && inputRef.current) {
        inputRef.current.focus();
    }
  }, [replyingTo]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue, replyingTo?.id);
    setInputValue('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setMentionQuery(null);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
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
            return <span key={i} className="bg-theme-gold/20 text-theme-gold px-1 rounded font-bold cursor-default">@everyone</span>;
        }
        if (word.startsWith('@')) {
            const username = word.substring(1);
            const user = allUsers.find(u => u.username === username);
            if (user) {
                return (
                    <span 
                        key={i} 
                        className="text-theme-gold-light bg-theme-gold/10 px-1 rounded font-bold cursor-pointer hover:underline hover:bg-theme-gold/20 transition-all" 
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
        {forwardingMessage && (
            <ForwardModal 
                servers={servers} 
                friends={friends} 
                messageContent={forwardingMessage.content}
                onClose={() => setForwardingMessage(null)}
                onForward={(targetId) => onForwardMessage(targetId, forwardingMessage.content)}
            />
        )}

        <div className="flex-1 flex flex-col bg-theme-bg relative overflow-hidden mandala-bg min-w-0">
        {/* Top Header */}
        <div className="h-16 border-b border-theme-border flex items-center px-8 justify-between bg-theme-bg/80 backdrop-blur-md sticky top-0 z-20 shadow-xl shrink-0">
            <div className="flex items-center gap-4">
            <span className="text-theme-text-muted font-serif text-2xl">✦</span>
            <div className="flex flex-col">
                <span className="royal-font font-bold text-theme-gold uppercase tracking-widest text-lg">{channelName}</span>
                <span className="text-[9px] text-theme-text-dim uppercase tracking-[0.2em] font-bold">
                  {isDM ? 'Private Correspondence' : 'Chamber of Discourse'}
                </span>
            </div>
            </div>
            <div className="flex items-center gap-6 text-theme-text-dim">
            
            {/* Private Call Buttons for DMs */}
            {isDM && onCall && (
                <div className="flex items-center gap-4 border-r border-theme-border pr-6">
                    <button 
                        onClick={() => onCall('VOICE')}
                        className="hover:text-theme-gold hover:scale-110 transition-all"
                        title="Voice Call"
                    >
                        {ICONS.Phone}
                    </button>
                    <button 
                        onClick={() => onCall('VIDEO')}
                        className="hover:text-theme-gold hover:scale-110 transition-all"
                        title="Video Call"
                    >
                        {ICONS.Video}
                    </button>
                </div>
            )}

            {/* Notifications */}
            <div className="relative">
                <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`hover:text-theme-gold transition-colors relative ${showNotifications ? 'text-theme-gold' : ''}`}
                >
                {ICONS.Bell}
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full border border-black animate-pulse" />
                )}
                </button>
                
                {showNotifications && (
                <div className="absolute right-0 top-full mt-4 w-80 bg-theme-panel border border-theme-text-dim shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-theme-border text-xs font-bold uppercase tracking-widest text-theme-text-muted bg-theme-bg royal-font">
                    Decrees & Summons
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="p-6 text-center text-[10px] text-theme-text-dim font-medium italic">
                        No new correspondence.
                        </div>
                    ) : (
                        notifications.map(notif => (
                        <div key={notif.id} className="p-4 border-b border-theme-border hover:bg-white/5 transition-colors">
                            <div className="text-theme-text-highlight text-xs mb-1 font-bold royal-font">
                            {notif.type === 'FRIEND_REQUEST' ? 'Alliance Proposal' : notif.type === 'MENTION' ? 'You were Summoned' : 'System Decree'}
                            </div>
                            <p className="text-theme-text-muted text-[11px] mb-3">{notif.content}</p>
                            
                            {notif.type === 'FRIEND_REQUEST' && notif.fromUserId && (
                            <div className="flex gap-2">
                                <button 
                                onClick={() => onAcceptFriendRequest(notif.fromUserId!, notif.id)}
                                className="flex-1 bg-white/5 border border-theme-border hover:border-theme-gold hover:text-theme-gold text-theme-text-dim text-[9px] font-bold uppercase tracking-widest py-1 flex items-center justify-center gap-1 transition-all"
                                >
                                {ICONS.Check} Accept
                                </button>
                                <button 
                                onClick={() => onRejectFriendRequest(notif.id)}
                                className="flex-1 bg-white/5 border border-theme-border hover:border-red-900 hover:text-red-600 text-theme-text-dim text-[9px] font-bold uppercase tracking-widest py-1 flex items-center justify-center gap-1 transition-all"
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

            {!isDM && (
                <button 
                onClick={() => setShowMembers(!showMembers)}
                className={`hover:text-theme-gold transition-colors ${showMembers ? 'text-theme-gold' : ''}`}
                >
                    {ICONS.Users}
                </button>
            )}
            {!isDM && <div className="w-[1px] h-6 bg-theme-border" />}
            {!isDM && <button className="hover:text-theme-gold transition-colors">{ICONS.Settings}</button>}
            </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar" ref={scrollRef} onClick={() => setReactingToMessageId(null)}>
            <div className="py-16 px-10 border-b border-theme-border mb-10 max-w-4xl mx-auto text-center ornate-divider">
            <div>
                <div className="w-20 h-20 rounded-full border border-theme-gold flex items-center justify-center mx-auto mb-6 bg-black shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                    <span className="text-3xl text-theme-gold">✦</span>
                </div>
                <h1 className="text-4xl royal-font font-bold text-theme-gold mb-2 uppercase tracking-widest">
                  {isDM ? `Conversation with ${channelName}` : `Welcome to ${channelName}`}
                </h1>
                <p className="text-theme-text-muted font-medium text-sm tracking-wide">The archives of this conversation begin here.</p>
            </div>
            </div>

            {messages.map((msg) => {
            const senderRole = !isDM ? getHighestRole(msg.userId) : null;
            const isMention = msg.content.includes(`@${currentUser?.username}`) || msg.content.includes('@everyone');
            const canDelete = currentUser?.id === msg.userId || server?.ownerId === currentUser?.id;
            const parentMessage = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;
            
            return (
                <div key={msg.id} className={`flex gap-6 group px-4 py-2 transition-all rounded-lg border border-transparent hover:border-theme-border relative ${isMention ? 'bg-theme-gold/10 border-l-2 border-l-theme-gold' : 'hover:bg-theme-gold/5'}`}>
                
                {/* Action Buttons (On Hover) */}
                <div className="absolute top-0 right-4 -translate-y-1/2 flex items-center bg-theme-panel border border-theme-text-dim rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10 scale-90">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setReactingToMessageId(reactingToMessageId === msg.id ? null : msg.id); }} 
                        className="p-2 text-theme-text-muted hover:text-theme-gold hover:bg-white/5 transition-colors relative" 
                        title="React"
                    >
                        <SmilePlus size={14} />
                    </button>
                    <button onClick={() => setReplyingTo(msg)} className="p-2 text-theme-text-muted hover:text-theme-gold hover:bg-white/5 transition-colors" title="Reply">
                        <Reply size={14} />
                    </button>
                    <button onClick={() => handleCopy(msg.content)} className="p-2 text-theme-text-muted hover:text-theme-gold hover:bg-white/5 transition-colors" title="Copy">
                        <Copy size={14} />
                    </button>
                    <button onClick={() => setForwardingMessage(msg)} className="p-2 text-theme-text-muted hover:text-theme-gold hover:bg-white/5 transition-colors" title="Forward">
                        <Forward size={14} />
                    </button>
                    {canDelete && (
                        <button onClick={() => onDeleteMessage(msg.id)} className="p-2 text-red-700 hover:text-red-500 hover:bg-white/5 transition-colors" title="Delete">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>

                {/* Reaction Picker (Absolute) */}
                {reactingToMessageId === msg.id && (
                    <div className="absolute top-8 right-0 z-20 bg-theme-panel border border-theme-border p-2 grid grid-cols-6 gap-1 shadow-2xl rounded-lg animate-in fade-in zoom-in-95 duration-100 w-48">
                        {EMOJIS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={(e) => { e.stopPropagation(); onAddReaction(msg.id, emoji); setReactingToMessageId(null); }}
                                className="p-1 hover:bg-white/10 rounded text-lg flex items-center justify-center transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}

                <div 
                    className="shrink-0 pt-1 cursor-pointer"
                    onClick={() => onViewUser(msg.userId)}
                >
                    <img 
                    src={allUsers.find(u => u.id === msg.userId)?.avatar || `https://picsum.photos/seed/${msg.userId}/100/100`}
                    className="w-12 h-12 rounded-full ring-2 ring-theme-border group-hover:ring-theme-gold transition-all object-cover shadow-lg" 
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span 
                        onClick={() => onViewUser(msg.userId)}
                        className="royal-font font-bold text-theme-text-highlight hover:underline cursor-pointer uppercase text-xs tracking-wider"
                    >
                        {allUsers.find(u => u.id === msg.userId)?.username || 'Unknown Noble'}
                    </span>
                    
                    {senderRole && (
                        <span 
                        className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border rounded-sm flex items-center gap-1"
                        style={{ 
                            color: senderRole.color, 
                            borderColor: senderRole.color,
                            backgroundColor: `${senderRole.color}15`
                        }}
                        >
                        {senderRole.icon && <span>{senderRole.icon}</span>}
                        {senderRole.name}
                        </span>
                    )}

                    <span className="text-[10px] text-theme-text-dim font-bold uppercase tracking-widest mt-0.5">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    </div>

                    {/* Reply Context */}
                    {parentMessage && (
                        <div className="flex items-center gap-2 mb-1 opacity-60 text-[10px] italic">
                            <div className="w-8 h-3 border-t-2 border-l-2 border-theme-text-dim rounded-tl-lg" />
                            <span className="text-theme-text-muted font-bold">@{allUsers.find(u => u.id === parentMessage.userId)?.username}:</span>
                            <span className="text-theme-text-dim truncate max-w-md">{parentMessage.content}</span>
                        </div>
                    )}

                    <p className="text-theme-text leading-relaxed font-light text-[15px] font-sans tracking-wide">
                        {renderMessageContent(msg.content)}
                    </p>

                    {/* Reactions Display */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                                // Explicitly cast userIds to string[] to resolve type errors
                                const ids = userIds as string[];
                                return (
                                <button
                                    key={emoji}
                                    onClick={() => onAddReaction(msg.id, emoji)}
                                    className={`px-1.5 py-0.5 rounded border text-[10px] flex items-center gap-1 transition-all ${
                                        ids.includes(currentUser?.id || '') 
                                            ? 'bg-theme-gold/10 border-theme-gold text-theme-gold' 
                                            : 'bg-white/5 border-transparent hover:border-theme-text-muted text-theme-text-muted'
                                    }`}
                                >
                                    <span>{emoji}</span>
                                    <span className="font-bold">{ids.length}</span>
                                </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                </div>
            );
            })}
            <div className="h-4" />
        </div>

        {/* Input */}
        <div className="px-8 pb-8 pt-4 bg-gradient-to-t from-theme-bg to-transparent relative shrink-0">
            {/* Mention Autocomplete */}
            {mentionQuery !== null && (filteredUsers.length > 0 || showEveryoneOption) && (
                <div className="absolute bottom-24 left-16 bg-theme-panel border border-theme-text-dim shadow-2xl z-50 rounded min-w-[200px] overflow-hidden">
                    <div className="p-2 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-theme-text-muted border-b border-theme-border">
                        Summoning
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                        {showEveryoneOption && (
                            <button 
                                onClick={() => insertMention('everyone')}
                                className="w-full text-left px-3 py-2 hover:bg-theme-gold/20 text-theme-gold font-bold text-xs flex items-center gap-2"
                            >
                                <span>@</span> everyone
                            </button>
                        )}
                        {filteredUsers.map(user => (
                            <button 
                                key={user.id}
                                onClick={() => insertMention(user.username)}
                                className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2 group"
                            >
                                <img src={user.avatar} className="w-5 h-5 rounded-full" />
                                <span className="text-theme-text group-hover:text-theme-gold font-medium text-xs">{user.username}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {showEmojiPicker && (
            <div className="absolute bottom-24 right-12 bg-theme-panel border border-theme-border p-2 grid grid-cols-4 gap-2 shadow-2xl z-50">
                {EMOJIS.map(emoji => (
                <button 
                    key={emoji} 
                    onClick={() => setInputValue(prev => prev + emoji)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded text-xl"
                >
                    {emoji}
                </button>
                ))}
            </div>
            )}
            
            {/* Reply Indicator Bar */}
            {replyingTo && (
                <div className="flex items-center justify-between bg-theme-panel border-t border-l border-r border-theme-border px-4 py-2 mx-2 rounded-t text-xs">
                    <div className="flex items-center gap-2 text-theme-text-muted">
                        <Reply size={12} />
                        <span>Replying to <span className="text-theme-gold font-bold">@{allUsers.find(u => u.id === replyingTo.userId)?.username}</span></span>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="text-theme-text-dim hover:text-theme-gold">
                        <X size={14} />
                    </button>
                </div>
            )}

            <div className={`bg-theme-panel border border-theme-border flex items-center px-4 py-3 gap-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] focus-within:border-theme-text-muted transition-all relative ${replyingTo ? 'rounded-b border-t-0' : 'rounded-none'}`}>
            {/* Decorative corners */}
            {!replyingTo && (
                <>
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-theme-gold" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-theme-gold" />
                </>
            )}
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-theme-gold" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-theme-gold" />

            <button className="w-8 h-8 flex items-center justify-center text-theme-text-dim hover:text-theme-gold transition-all">
                {ICONS.Plus}
            </button>
            <input
                ref={inputRef}
                type="text"
                placeholder={isDM ? `Message @${channelName}` : `Inscribe upon #${channelName}...`}
                className="flex-1 bg-transparent border-none outline-none text-theme-text placeholder-theme-border font-medium text-[15px] royal-font"
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
                className="w-8 h-8 flex items-center justify-center text-theme-gold hover:scale-110 transition-transform"
                >
                <SendHorizontal size={20} />
                </button>
            </div>
            </div>
        </div>
        </div>

        {/* Member List Sidebar - Only show for servers */}
        {showMembers && !isDM && (
            <div className="w-64 bg-theme-panel border-l border-theme-border flex flex-col shrink-0 animate-in slide-in-from-right-10 duration-200 shadow-xl z-20">
                <div className="p-4 border-b border-theme-border bg-theme-bg">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-theme-gold royal-font">
                        Subjects - {server?.memberRoles ? Object.keys(server.memberRoles).length : 0}
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
                    {memberGroups.map((group, idx) => (
                        <div key={group.role?.id || 'norole' + idx}>
                             <div className="text-[10px] font-bold uppercase text-theme-text-dim tracking-[0.2em] mb-2 px-2 royal-font">
                                {group.role ? group.role.name : 'Subjects'}
                             </div>
                             <div className="space-y-1">
                                {group.members.map(member => (
                                    <button 
                                      key={member.id} 
                                      onClick={() => onViewUser(member.id)}
                                      className="w-full flex items-center p-2 rounded hover:bg-white/5 group transition-all"
                                    >
                                        <div className="relative shrink-0">
                                            <img src={member.avatar} className="w-8 h-8 rounded-full border border-theme-border group-hover:border-theme-gold object-cover" />
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-theme-panel ${
                                                member.status === 'online' ? 'bg-green-600' : 
                                                member.status === 'idle' ? 'bg-yellow-600' : 
                                                member.status === 'dnd' ? 'bg-red-600' : 'bg-gray-600'
                                            }`} />
                                        </div>
                                        <div className="ml-3 text-left overflow-hidden">
                                            <div className={`text-sm font-bold truncate royal-font ${group.role ? '' : 'text-theme-text-muted'}`} style={{ color: group.role?.color }}>
                                                {member.username}
                                            </div>
                                            {member.customStatus && (
                                                <div className="text-[9px] text-theme-text-dim truncate italic">{member.customStatus}</div>
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
