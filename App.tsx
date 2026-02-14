
import React, { useState, useEffect } from 'react';
import { AppState, User, Server, ChannelType, Channel, Message, Role, Notification } from './types';
import { ICONS } from './constants';
import Sidebar from './components/Sidebar';
import ChannelBar from './components/ChannelBar';
import ChatArea from './components/ChatArea';
import Auth from './components/Auth';
import CallScreen from './components/CallScreen';
import ServerSettings from './components/ServerSettings';
import UserSettings from './components/UserSettings';
import ServerInfoModal from './components/ServerInfoModal';
import UserProfileModal from './components/UserProfileModal';
import { socket } from './services/socket';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    servers: [],
    activeServerId: null,
    activeChannelId: null,
    messages: {},
    friends: [],
    notifications: [],
    viewingUserId: null,
    isCallActive: false,
    callType: null,
    isCreateServerOpen: false,
    isCreateChannelOpen: false,
    isAddFriendOpen: false,
    isExploreOpen: false,
    isServerSettingsOpen: false,
    isUserSettingsOpen: false,
    isServerInfoOpen: false,
    noiseThreshold: 0.05,
    isMicMuted: false,
    ping: 24,
    connectionStatus: 'stable'
  });

  const [newServerName, setNewServerName] = useState('');
  const [joinServerQuery, setJoinServerQuery] = useState(''); 
  const [createMode, setCreateMode] = useState<'create' | 'join'>('create');
  const [newChannelName, setNewChannelName] = useState('');
  const [createChannelType, setCreateChannelType] = useState<ChannelType>(ChannelType.TEXT);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState<User[] | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [globalUserCache, setGlobalUserCache] = useState<User[]>([]);
  const [publicServers, setPublicServers] = useState<Server[]>([]);

  // Initialize Socket & Session
  useEffect(() => {
    socket.connect();

    // Check if we have a previous session to restore automatically
    const savedUser = localStorage.getItem('cc_user');
    if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        // We trust local storage for ID, but fetch fresh data
        fetchData(parsedUser.id);
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchData = (userId: string) => {
      socket.emit('data:sync', { userId }, (response: any) => {
          if (response.error) {
              console.error("Sync failed:", response.error);
              localStorage.removeItem('cc_user'); // Invalid session
              setState(p => ({ ...p, currentUser: null }));
              return;
          }

          // Update State with fresh server data
          setState(prev => ({
              ...prev,
              currentUser: response.user,
              servers: response.servers,
              friends: response.friends,
              notifications: response.notifications
          }));
          
          setGlobalUserCache(response.allUsers || []);
          // Public servers are not sent in sync per user, let's assume all servers we know are the starting point, 
          // or we can fetch explore data later. For now, let's filter explore from all servers logic if available?
          // Actually, let's assume we can fetch them or just use what we have if they are public.
          // In this implementation, `data:sync` returns servers user is IN. 
          // We can fetch public servers separately or assume `globalUserCache` helps identify people.
      });
  };

  // Event Listeners
  useEffect(() => {
    if (!state.currentUser) return;

    // --- Message ---
    const onNewMessage = (data: { channelId: string, message: Message }) => {
      setState(prev => {
        const { channelId, message } = data;
        const currentMessages = prev.messages[channelId] || [];
        if (currentMessages.some(m => m.id === message.id)) return prev;
        return {
          ...prev,
          messages: { ...prev.messages, [channelId]: [...currentMessages, message] }
        };
      });
    };

    const onHistory = (data: { channelId: string, messages: Message[] }) => {
        setState(prev => ({
            ...prev,
            messages: { ...prev.messages, [data.channelId]: data.messages }
        }));
    };

    // --- Friends ---
    const onFriendRequestReceived = (notification: any) => {
        setState(prev => ({
            ...prev,
            notifications: [notification, ...prev.notifications]
        }));
    };

    const onFriendRequestAccepted = (data: { user: User }) => {
        setState(prev => ({
            ...prev,
            friends: [...prev.friends, data.user],
            notifications: [{
                id: 'sys_' + Date.now(),
                type: 'SYSTEM',
                content: `${data.user.username} accepted your alliance!`,
                read: false,
                timestamp: Date.now()
            }, ...prev.notifications]
        }));
    };

    // --- Updates ---
    const onServerUpdated = (updatedServer: Server) => {
        setState(prev => {
            // Check if we are a member (in our list)
            const exists = prev.servers.some(s => s.id === updatedServer.id);
            if (exists) {
                return {
                    ...prev,
                    servers: prev.servers.map(s => s.id === updatedServer.id ? updatedServer : s)
                };
            }
            // If it's a public server update (for explore view), we might want to update a separate list
            setPublicServers(curr => {
                const pExists = curr.some(s => s.id === updatedServer.id);
                if (pExists) return curr.map(s => s.id === updatedServer.id ? updatedServer : s);
                if (updatedServer.isPublic) return [...curr, updatedServer];
                return curr;
            });
            return prev;
        });
    };

    const onUserUpdated = (updatedUser: User) => {
        setGlobalUserCache(prev => {
            const exists = prev.some(u => u.id === updatedUser.id);
            if (exists) return prev.map(u => u.id === updatedUser.id ? updatedUser : u);
            return [...prev, updatedUser];
        });

        // If it's current user, update state
        if (updatedUser.id === state.currentUser?.id) {
            setState(p => ({ ...p, currentUser: updatedUser }));
            localStorage.setItem('cc_user', JSON.stringify(updatedUser)); // Keep session locally synced
        }
        
        // If friend, update friend list view
        setState(prev => ({
            ...prev,
            friends: prev.friends.map(f => f.id === updatedUser.id ? updatedUser : f)
        }));
    };

    socket.on('new_message', onNewMessage);
    socket.on('history', onHistory);
    socket.on('friend_request_received', onFriendRequestReceived);
    socket.on('friend_request_accepted', onFriendRequestAccepted);
    socket.on('server:updated', onServerUpdated);
    socket.on('user:updated', onUserUpdated);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('history', onHistory);
      socket.off('friend_request_received', onFriendRequestReceived);
      socket.off('friend_request_accepted', onFriendRequestAccepted);
      socket.off('server:updated', onServerUpdated);
      socket.off('user:updated', onUserUpdated);
    };
  }, [state.currentUser]);

  // Join channel room
  useEffect(() => {
    if (state.activeChannelId) {
        socket.emit('join_channel', state.activeChannelId);
    }
  }, [state.activeChannelId]);

  // Theme Sync
  useEffect(() => {
    let theme = 'royal';
    const activeServer = state.servers.find(s => s.id === state.activeServerId);
    if (activeServer && activeServer.theme) {
      theme = activeServer.theme;
    } else if (state.currentUser?.profileTheme) {
      theme = state.currentUser.profileTheme;
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [state.currentUser?.profileTheme, state.activeServerId, state.servers]);

  // Ping Sim
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const jitter = Math.floor(Math.random() * 10) - 5;
        const newPing = Math.max(12, Math.min(150, prev.ping + jitter));
        let status: 'stable' | 'lagging' | 'disconnected' = 'stable';
        if (newPing > 100) status = 'lagging';
        return { ...prev, ping: newPing, connectionStatus: status };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);


  const handleLogin = (user: User) => {
    localStorage.setItem('cc_user', JSON.stringify(user));
    fetchData(user.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('cc_user');
    setState(prev => ({ ...prev, currentUser: null, isUserSettingsOpen: false, servers: [] }));
  };

  const handleUpdateUser = async (updates: Partial<User>): Promise<boolean | string> => {
    if (!state.currentUser) return false;
    return new Promise((resolve) => {
        socket.emit('user:update', { userId: state.currentUser!.id, updates }, (response: any) => {
            if (response.success) resolve(true);
            else resolve(response.error || "Update failed");
        });
    });
  };

  const handleServerSelect = (id: string | null) => {
    setState(prev => {
      const server = prev.servers.find(s => s.id === id);
      const firstChannel = server?.channels.find(c => c.type === ChannelType.TEXT);
      return { 
        ...prev, 
        activeServerId: id, 
        activeChannelId: firstChannel ? firstChannel.id : null,
        isExploreOpen: false,
        isServerSettingsOpen: false,
        isServerInfoOpen: false
      };
    });
  };

  const handleSendMessage = (content: string, replyToId?: string) => {
      if (!state.activeChannelId || !state.currentUser) return;
      const newMessage: Message = {
          id: 'm' + Date.now() + Math.random().toString(36).substr(2, 9),
          userId: state.currentUser.id,
          content,
          timestamp: Date.now(),
          replyToId,
          reactions: {} 
      };
      socket.emit('send_message', { channelId: state.activeChannelId, message: newMessage });
  };

  // --- FRIEND LOGIC ---

  const handleSearchFriends = () => {
    if (!friendSearchQuery.trim()) return;
    const results = globalUserCache.filter(u => u.username.toLowerCase().includes(friendSearchQuery.toLowerCase()));
    setFriendSearchResults(results);
  };

  const handleAddFriend = (targetUser: User) => {
    if (state.currentUser && targetUser.id === state.currentUser.id) {
        alert("You cannot ally with yourself.");
        return;
    }
    if (state.friends.some(f => f.id === targetUser.id)) {
        alert("Already allied.");
        return;
    }
    socket.emit('friend:request', { fromUserId: state.currentUser!.id, toUserId: targetUser.id });
    alert(`Alliance proposal dispatched to ${targetUser.username}.`);
    setState(p => ({...p, isAddFriendOpen: false}));
  };

  const handleSendFriendRequest = (toUserId: string) => {
      if (state.currentUser) {
          socket.emit('friend:request', { fromUserId: state.currentUser.id, toUserId });
          alert("Alliance proposal dispatched.");
      }
  };

  const handleAcceptFriendRequest = (userId: string, notificationId: string) => {
      // Find the user object from our global cache
      const friend = globalUserCache.find(u => u.id === userId);
      
      if (friend && state.currentUser) {
          socket.emit('friend:accept', { userId: state.currentUser.id, friendId: userId });
          
          setState(prev => ({
              ...prev,
              friends: [...prev.friends, friend],
              notifications: prev.notifications.filter(n => n.id !== notificationId)
          }));
      }
  };

  const handleRejectFriendRequest = (notificationId: string) => {
      setState(prev => ({
          ...prev,
          notifications: prev.notifications.filter(n => n.id !== notificationId)
      }));
  };
  
  const handleRemoveFriend = (friendId: string) => {
    setState(prev => ({
      ...prev,
      friends: prev.friends.filter(f => f.id !== friendId)
    }));
    // Note: Should probably implement server-side remove too
  };

  // --- SERVER LOGIC ---

  const joinServer = (server: Server) => {
      if (!state.currentUser) return;
      
      socket.emit('server:join', { serverId: server.id, userId: state.currentUser.id });
      
      // Optimistic update or wait for server push? 
      // Server will emit 'server:updated', but let's update locally to be snappy
      const updatedServer = { 
          ...server, 
          memberJoinedAt: { ...server.memberJoinedAt, [state.currentUser.id]: Date.now() } 
      };

      setState(prev => ({
          ...prev,
          servers: [...prev.servers, updatedServer],
          activeServerId: server.id,
          activeChannelId: updatedServer.channels[0]?.id || null,
          isExploreOpen: false
      }));
  };

  const handleJoinServer = (queryOverride?: string) => {
      const query = queryOverride || joinServerQuery;
      if (!query.trim()) return;
      
      // Search in all servers (we need an endpoint for this ideally, but using global cache for now)
      // Since we don't have ALL servers in state, this search is limited to what we know.
      // Ideally we ask server "Find me this server". 
      // For this implementation, let's check our known public servers or ask user to provide ID.
      // Note: In real app, `socket.emit('server:search', ...)`
      
      // Fallback: Check global cache of public servers from `data:sync` if we implemented that fully, 
      // but we didn't send ALL servers. Let's assume user entered an ID or Name we can find in `publicServers` state (which we populate on explore).
      // Or search local joined servers first.
      
      const targetServer = state.servers.find(s => s.id === query || s.name.toLowerCase() === query.toLowerCase());
      
      if (targetServer) {
          handleServerSelect(targetServer.id);
          setState(prev => ({ ...prev, isCreateServerOpen: false }));
          return;
      }
      
      alert("Realm not found in your archives. Try exploring public realms.");
  };

  const createServer = () => {
    if (!newServerName.trim() || !state.currentUser) return;
    const newServer: Server = {
      id: 's' + Date.now(),
      name: newServerName,
      icon: `https://picsum.photos/seed/${newServerName}/100/100`,
      banner: 'https://picsum.photos/seed/default_banner/800/200',
      ownerId: state.currentUser.id,
      createdAt: Date.now(),
      theme: 'royal',
      isPublic: false, 
      roles: [{ id: 'r_owner', name: 'Monarch', color: '#D4AF37', icon: '👑', permissions: ['MANAGE_SERVER', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'KICK_MEMBERS', 'SEND_MESSAGES', 'MENTION_EVERYONE'] }],
      memberRoles: { [state.currentUser.id]: ['r_owner'] },
      memberJoinedAt: { [state.currentUser.id]: Date.now() },
      channels: [
        { id: 'c' + Date.now(), name: 'throne-room', type: ChannelType.TEXT }
      ]
    };
    
    socket.emit('server:create', newServer, () => {
        setState(prev => ({
            ...prev,
            servers: [...prev.servers, newServer],
            isCreateServerOpen: false,
            activeServerId: newServer.id,
            activeChannelId: newServer.channels[0].id
        }));
    });
    setNewServerName('');
  };

  // Other handlers
  const createChannel = () => {
    if (!newChannelName.trim() || !state.activeServerId) return;
    const currentServer = state.servers.find(s => s.id === state.activeServerId);
    if (!currentServer) return;

    const newChannel: Channel = {
      id: 'c' + Date.now(),
      name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
      type: createChannelType
    };
    
    const updatedServer = {
        ...currentServer,
        channels: [...currentServer.channels, newChannel]
    };

    socket.emit('server:update', { serverId: currentServer.id, updates: { channels: updatedServer.channels } });
    
    setState(prev => ({
        ...prev,
        servers: prev.servers.map(s => s.id === prev.activeServerId ? updatedServer : s),
        isCreateChannelOpen: false,
        activeChannelId: newChannel.id
    }));
    setNewChannelName('');
  };

  const updateActiveServer = (updates: Partial<Server>) => {
      if (!state.activeServerId) return;
      socket.emit('server:update', { serverId: state.activeServerId, updates });
      
      setState(prev => ({
          ...prev,
          servers: prev.servers.map(s => s.id === prev.activeServerId ? { ...s, ...updates } : s)
      }));
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    if (!state.activeChannelId || !state.currentUser) return;
    setState(prev => {
        const channelMessages = prev.messages[prev.activeChannelId!] || [];
        const updatedMessages = channelMessages.map(msg => {
            if (msg.id === messageId) {
                const currentReactions = msg.reactions || {};
                const users = currentReactions[emoji] || [];
                let newUsers = users.includes(state.currentUser!.id) 
                    ? users.filter(id => id !== state.currentUser!.id) 
                    : [...users, state.currentUser!.id];
                const newReactions = { ...currentReactions };
                if (newUsers.length > 0) newReactions[emoji] = newUsers;
                else delete newReactions[emoji];
                return { ...msg, reactions: newReactions };
            }
            return msg;
        });
        return {
            ...prev,
            messages: { ...prev.messages, [prev.activeChannelId!]: updatedMessages }
        };
    });
  };

  // Helper vars
  const activeServer = state.servers.find(s => s.id === state.activeServerId) || null;
  const activeChannel = activeServer?.channels.find(c => c.id === state.activeChannelId) || null;
  const activeMessages = state.activeChannelId ? (state.messages[state.activeChannelId] || []) : [];
  
  const isDM = !state.activeServerId && state.activeChannelId && state.activeChannelId.startsWith('dm_');
  let currentChannelName = activeChannel?.name || 'Unknown';
  if (isDM) {
      const dmFriendId = state.activeChannelId!.replace('dm_', '');
      const friend = state.friends.find(f => f.id === dmFriendId);
      currentChannelName = friend?.username || 'Private Chat';
  }

  // Combine currentUser, friends, and ALL cached users for comprehensive lookups
  const allKnownUsers = [
      ...(state.currentUser ? [state.currentUser] : []),
      ...state.friends,
      ...globalUserCache.filter(u => u.id !== state.currentUser?.id && !state.friends.some(f => f.id === u.id))
  ];

  // Explore Logic: use public servers we might have fetched or just filter from all known if we want to show something
  // For now, let's show all public servers from global cache + seeded ones if user doesn't have them
  // A real app would have a dedicated 'explore' endpoint.
  // We can assume globalUserCache contains users, but we need servers.
  // Let's rely on the user to have joined servers or we only show what we have.
  // WAIT: We need to populate `publicServers` on mount if we want Explore to work for non-joined servers.
  // Added a quick fetch for that in `data:sync` logic on server (it returns `allUsers` but I'll add `allPublicServers` too, see server.js change)
  
  const getCallParticipants = (): User[] => {
    if (isDM && state.activeChannelId) {
        const friendId = state.activeChannelId.replace('dm_', '');
        const friend = state.friends.find(f => f.id === friendId);
        return friend ? [friend] : [];
    }
    return [];
  };

  if (!state.currentUser) return <Auth onLogin={handleLogin} />;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-theme-bg text-theme-text select-none antialiased font-['Inter']">
      
      {/* Mobile Navigation */}
      <div className={`fixed inset-0 z-40 flex md:static md:flex ${showMobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} transition-transform duration-300 bg-black/90 md:bg-transparent backdrop-blur md:backdrop-blur-none`}>
        <Sidebar 
            servers={state.servers} 
            activeServerId={state.activeServerId} 
            onServerSelect={(id) => { handleServerSelect(id); setShowMobileMenu(false); }} 
            onAddServer={() => { setState(prev => ({ ...prev, isCreateServerOpen: true })); setShowMobileMenu(false); }}
            onExplore={() => { setState(prev => ({ ...prev, isExploreOpen: true, activeServerId: null })); setShowMobileMenu(false); }}
        />
        <div className="flex flex-col h-full border-r border-theme-border">
            <ChannelBar 
                server={activeServer}
                friends={state.friends}
                activeChannelId={state.activeChannelId}
                currentUser={state.currentUser}
                onChannelSelect={(id) => { setState(prev => ({ ...prev, activeChannelId: id })); setShowMobileMenu(false); }}
                onCall={(type) => setState(prev => ({ ...prev, isCallActive: true, callType: type as any }))}
                noiseThreshold={state.noiseThreshold}
                isMicMuted={state.isMicMuted}
                ping={state.ping}
                connectionStatus={state.connectionStatus}
                onSettingsChange={(settings) => setState(prev => ({ ...prev, ...settings }))}
                onCreateChannel={(type) => { setCreateChannelType(type); setState(prev => ({ ...prev, isCreateChannelOpen: true })); }}
                onOpenSettings={() => setState(prev => ({ ...prev, isServerSettingsOpen: true }))}
                onOpenServerInfo={() => setState(prev => ({ ...prev, isServerInfoOpen: true }))}
                onOpenUserSettings={() => setState(prev => ({ ...prev, isUserSettingsOpen: true }))}
                onUpdateUser={handleUpdateUser}
                onAddFriend={() => setState(prev => ({ ...prev, isAddFriendOpen: true }))}
            />
        </div>
        <div className="flex-1 md:hidden" onClick={() => setShowMobileMenu(false)} />
      </div>
      
      <div className="flex flex-1 min-w-0">
        <main className="flex-1 flex flex-col relative bg-theme-bg min-w-0">
          {state.isExploreOpen ? (
            <div className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar animate-in fade-in duration-300 mandala-bg">
              <div className="md:hidden mb-4">
                 <button onClick={() => setShowMobileMenu(true)} className="text-theme-gold"><Menu size={24} /></button>
              </div>
              <h1 className="text-2xl md:text-4xl royal-font font-bold mb-6 md:mb-10 text-theme-gold uppercase tracking-widest text-center border-b border-theme-border pb-6">Kingdoms of the Realm</h1>
              {/* Explore logic: Show servers we are not part of, assuming we had a way to fetch them. 
                  In this mock, I will just show *all* servers from state for demo purposes, 
                  filtering by those we haven't joined if we could see them. 
                  Since we only sync joined servers, Explore is limited unless we fetch public ones.
                  For now, let's show joined servers as "Already Joined" and placeholders if empty.
              */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                {state.servers.map(server => (
                    <div key={server.id} className="bg-theme-panel border border-theme-border p-4 shadow-xl hover:border-theme-gold transition-all group cursor-pointer relative overflow-hidden flex flex-col h-full">
                    <div className="absolute top-0 left-0 w-full h-1 bg-theme-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative h-32 md:h-40 mb-4 overflow-hidden bg-black">
                        <img src={server.banner || "https://picsum.photos/seed/default_banner/800/200"} className="w-full h-full object-cover sepia-[0.5] group-hover:sepia-0 transition-all opacity-80" />
                        <div className="absolute bottom-[-20px] left-4">
                            <img src={server.icon} className="w-16 h-16 rounded-full border-4 border-theme-panel object-cover shadow-lg" />
                        </div>
                    </div>
                    <div className="mt-4 flex-1">
                            <h3 className="font-bold text-lg mb-1 uppercase tracking-wide text-theme-gold-light royal-font truncate">{server.name}</h3>
                            <p className="text-xs text-theme-text-dim mb-4">{Object.keys(server.memberJoinedAt).length} Members</p>
                    </div>
                    <button 
                        onClick={() => handleServerSelect(server.id)}
                        className="w-full py-3 bg-white/5 border border-theme-gold text-theme-gold font-bold uppercase text-xs tracking-widest transition-all royal-font mt-auto hover:bg-theme-gold hover:text-black"
                    >
                        Enter Realm
                    </button>
                    </div>
                ))}
                {/* Fallback for empty state or to show we can add more */}
                <div className="flex flex-col items-center justify-center p-8 border border-theme-text-dim border-dashed text-theme-text-muted">
                    <p className="text-xs mb-4">Discover more realms by searching.</p>
                </div>
              </div>
            </div>
          ) : (activeChannel || isDM) ? (
            <ChatArea 
              channelName={currentChannelName} 
              currentUser={state.currentUser} 
              messages={activeMessages}
              notifications={state.notifications}
              allUsers={allKnownUsers}
              server={activeServer}
              servers={state.servers}
              friends={state.friends}
              isDM={isDM}
              onSendMessage={handleSendMessage}
              onDeleteMessage={(id) => setState(p => ({...p, messages: {...p.messages, [state.activeChannelId!]: p.messages[state.activeChannelId!].filter(m => m.id !== id)}}))}
              onForwardMessage={handleSendMessage}
              onViewUser={(userId) => setState(prev => ({ ...prev, viewingUserId: userId }))}
              onAcceptFriendRequest={handleAcceptFriendRequest}
              onRejectFriendRequest={handleRejectFriendRequest}
              onCall={isDM ? (type) => setState(prev => ({ ...prev, isCallActive: true, callType: type as any })) : undefined}
              onAddReaction={handleAddReaction}
              onToggleMobileMenu={() => setShowMobileMenu(true)}
              onJoinServer={(link) => handleJoinServer(link)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 bg-theme-bg mandala-bg relative">
               <div className="md:hidden absolute top-4 left-4">
                 <button onClick={() => setShowMobileMenu(true)} className="text-theme-gold"><Menu size={24} /></button>
               </div>
               <div className="text-center opacity-50">
                  <div className="w-24 h-24 rounded-full border-2 border-theme-gold flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl text-theme-gold">⚜️</span>
                  </div>
                  <h1 className="text-3xl royal-font font-bold uppercase text-theme-text-muted tracking-widest">Awaiting Command</h1>
               </div>
            </div>
          )}
        </main>
      </div>

      {state.isServerSettingsOpen && activeServer && (
        <ServerSettings 
          server={activeServer}
          allUsers={allKnownUsers}
          onClose={() => setState(prev => ({ ...prev, isServerSettingsOpen: false }))}
          onUpdateServer={updateActiveServer}
        />
      )}

      {state.isUserSettingsOpen && state.currentUser && (
        <UserSettings 
          user={state.currentUser}
          noiseThreshold={state.noiseThreshold}
          onSettingsChange={(settings) => setState(prev => ({ ...prev, ...settings }))}
          onClose={() => setState(prev => ({ ...prev, isUserSettingsOpen: false }))}
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
        />
      )}

      {state.isServerInfoOpen && activeServer && (
        <ServerInfoModal 
          server={activeServer}
          members={allKnownUsers.filter(u => activeServer.memberJoinedAt[u.id])}
          onClose={() => setState(prev => ({ ...prev, isServerInfoOpen: false }))}
        />
      )}

      {state.viewingUserId && (
        <UserProfileModal 
          user={allKnownUsers.find(u => u.id === state.viewingUserId) || { id: state.viewingUserId, username: 'Unknown', email: '', avatar: 'https://picsum.photos/100', status: 'offline' } as User}
          currentUser={state.currentUser}
          isFriend={state.friends.some(f => f.id === state.viewingUserId)}
          onClose={() => setState(prev => ({ ...prev, viewingUserId: null }))}
          onAddFriend={() => handleSendFriendRequest(state.viewingUserId!)}
          onRemoveFriend={() => handleRemoveFriend(state.viewingUserId!)}
          onEditProfile={() => setState(prev => ({ ...prev, viewingUserId: null, isUserSettingsOpen: true }))}
        />
      )}

      {/* Basic Modals */}
      {(state.isCreateServerOpen || state.isCreateChannelOpen || state.isAddFriendOpen) && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-theme-panel border border-theme-border p-10 shadow-2xl relative" onClick={e => e.stopPropagation()}>
             <div className="absolute top-0 left-0 w-full h-1 bg-theme-gold" />
            
            {state.isCreateServerOpen && (
              <>
                <div className="flex justify-center gap-6 mb-6 border-b border-theme-border pb-4">
                    <button 
                      onClick={() => setCreateMode('create')}
                      className={`text-sm font-bold uppercase tracking-widest royal-font transition-colors ${createMode === 'create' ? 'text-theme-gold' : 'text-theme-text-dim hover:text-theme-text-muted'}`}
                    >
                        Found
                    </button>
                    <button 
                      onClick={() => setCreateMode('join')}
                      className={`text-sm font-bold uppercase tracking-widest royal-font transition-colors ${createMode === 'join' ? 'text-theme-gold' : 'text-theme-text-dim hover:text-theme-text-muted'}`}
                    >
                        Join
                    </button>
                </div>

                {createMode === 'create' ? (
                    <>
                        <h2 className="text-2xl royal-font font-bold mb-6 uppercase tracking-widest text-theme-gold-light text-center">New Dominion</h2>
                        <input autoFocus className="w-full bg-theme-bg border border-theme-border p-4 text-theme-text font-medium mb-8 focus:outline-none focus:border-theme-gold transition-all" placeholder="Kingdom Name" value={newServerName} onChange={e => setNewServerName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createServer()} />
                        <div className="flex justify-end gap-4">
                        <button onClick={() => setState(prev => ({ ...prev, isCreateServerOpen: false }))} className="font-bold text-theme-text-dim hover:text-theme-gold transition-colors uppercase text-xs tracking-widest royal-font">Retreat</button>
                        <button onClick={createServer} className="px-8 py-3 bg-theme-gold text-black font-bold uppercase text-xs tracking-widest hover:brightness-110 transition-all royal-font">Found</button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl royal-font font-bold mb-6 uppercase tracking-widest text-theme-gold-light text-center">Pledge Allegiance</h2>
                        <input autoFocus className="w-full bg-theme-bg border border-theme-border p-4 text-theme-text font-medium mb-8 focus:outline-none focus:border-theme-gold transition-all" placeholder="Invite Link or Server Name" value={joinServerQuery} onChange={e => setJoinServerQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleJoinServer()} />
                        <div className="flex justify-end gap-4">
                        <button onClick={() => setState(prev => ({ ...prev, isCreateServerOpen: false }))} className="font-bold text-theme-text-dim hover:text-theme-gold transition-colors uppercase text-xs tracking-widest royal-font">Retreat</button>
                        <button onClick={() => handleJoinServer()} className="px-8 py-3 bg-theme-gold text-black font-bold uppercase text-xs tracking-widest hover:brightness-110 transition-all royal-font">Join</button>
                        </div>
                    </>
                )}
              </>
            )}
            
            {state.isCreateChannelOpen && (
              <>
                <h2 className="text-2xl royal-font font-bold mb-6 uppercase tracking-widest text-theme-gold-light text-center">New {createChannelType === ChannelType.TEXT ? 'Chamber' : 'Sanctuary'}</h2>
                <input autoFocus className="w-full bg-theme-bg border border-theme-border p-4 text-theme-text font-medium mb-8 focus:outline-none focus:border-theme-gold transition-all" placeholder={createChannelType === ChannelType.TEXT ? "Chamber Title" : "Voice Channel Name"} value={newChannelName} onChange={e => setNewChannelName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createChannel()} />
                <div className="flex justify-end gap-4">
                  <button onClick={() => setState(prev => ({ ...prev, isCreateChannelOpen: false }))} className="font-bold text-theme-text-dim hover:text-theme-gold transition-colors uppercase text-xs tracking-widest royal-font">Retreat</button>
                  <button onClick={createChannel} className="px-8 py-3 bg-theme-gold text-black font-bold uppercase text-xs tracking-widest hover:brightness-110 transition-all royal-font">Construct</button>
                </div>
              </>
            )}

            {state.isAddFriendOpen && (
              <>
                <h2 className="text-2xl royal-font font-bold mb-6 uppercase tracking-widest text-theme-gold-light text-center">Seek Ally</h2>
                <div className="flex gap-2 mb-4">
                    <input 
                      autoFocus 
                      className="flex-1 bg-theme-bg border border-theme-border p-3 text-theme-text font-medium focus:outline-none focus:border-theme-gold transition-all" 
                      placeholder="User Identity" 
                      value={friendSearchQuery} 
                      onChange={e => setFriendSearchQuery(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleSearchFriends()} 
                    />
                    <button onClick={handleSearchFriends} className="px-4 bg-theme-gold text-black font-bold uppercase text-xs tracking-widest hover:brightness-110 transition-all royal-font">Search</button>
                </div>

                <div className="bg-theme-bg border border-theme-border max-h-60 overflow-y-auto mb-6 custom-scrollbar p-2">
                    {friendSearchResults === null ? (
                        <div className="text-center p-4 text-theme-text-dim text-xs italic">Enter a name to begin search.</div>
                    ) : friendSearchResults.length === 0 ? (
                        <div className="text-center p-4 text-theme-text-dim text-xs italic">No users found with that name.</div>
                    ) : (
                        <div className="space-y-1">
                            {friendSearchResults.map(user => {
                                const isAlreadyFriend = state.friends.some(f => f.id === user.id);
                                const isSelf = state.currentUser?.id === user.id;

                                return (
                                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded transition-all">
                                        <div className="flex items-center gap-3">
                                            <img src={user.avatar} className="w-8 h-8 rounded-full border border-theme-border object-cover" />
                                            <span className="text-sm font-bold text-theme-text royal-font">{user.username}</span>
                                        </div>
                                        {isSelf ? (
                                            <span className="text-[10px] text-theme-text-dim uppercase tracking-widest">You</span>
                                        ) : isAlreadyFriend ? (
                                            <span className="text-[10px] text-green-500 uppercase tracking-widest font-bold flex items-center gap-1">{ICONS.Check} Ally</span>
                                        ) : (
                                            <button 
                                                onClick={() => handleAddFriend(user)}
                                                className="px-3 py-1 bg-theme-gold/10 border border-theme-gold text-theme-gold hover:bg-theme-gold hover:text-black text-[10px] font-bold uppercase tracking-widest transition-all"
                                            >
                                                Add
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4">
                  <button onClick={() => { setState(prev => ({ ...prev, isAddFriendOpen: false })); setFriendSearchResults(null); setFriendSearchQuery(''); }} className="font-bold text-theme-text-dim hover:text-theme-gold transition-colors uppercase text-xs tracking-widest royal-font">Close</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {state.isCallActive && state.callType && state.currentUser && (
        <CallScreen 
          currentUser={state.currentUser}
          type={state.callType} 
          participants={getCallParticipants()} 
          onDisconnect={() => setState(prev => ({ ...prev, isCallActive: false, callType: null }))} 
        />
      )}
    </div>
  );
};

export default App;
