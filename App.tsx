
import React, { useState, useEffect } from 'react';
import { AppState, User, Server, ChannelType, Channel, Message, Role, Notification } from './types';
import { MOCK_SERVERS, MOCK_FRIENDS, ICONS, SEED_USERS, SEED_SERVERS } from './constants';
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

// Database Helper functions
const getUsersDB = () => {
  const db = localStorage.getItem('cc_users_db');
  return db ? JSON.parse(db) : {};
};

const getServersDB = (): Record<string, Server> => {
    const db = localStorage.getItem('cc_servers_db');
    return db ? JSON.parse(db) : {};
};

const saveServersDB = (db: Record<string, Server>) => {
    try {
        localStorage.setItem('cc_servers_db', JSON.stringify(db));
    } catch (e) {
        console.error("Server storage quota exceeded", e);
    }
};

const getReservedUsernames = () => {
  const db = localStorage.getItem('cc_reserved_usernames');
  return db ? JSON.parse(db) : [];
};

const saveUsersDB = (db: any) => {
  try {
    localStorage.setItem('cc_users_db', JSON.stringify(db));
  } catch (e) {
    console.error("Storage limit exceeded", e);
    throw new Error("Storage quota exceeded. Image too large?");
  }
};

const saveReservedUsernames = (db: any) => {
  try {
    localStorage.setItem('cc_reserved_usernames', JSON.stringify(db));
  } catch (e) {
    console.error("Storage limit exceeded", e);
  }
};

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
  const [refreshKey, setRefreshKey] = useState(0); 

  // Initial Seeding & Socket
  useEffect(() => {
    // Merge Seed Users into DB if missing
    const usersDB = getUsersDB();
    let usersUpdated = false;
    SEED_USERS.forEach(user => {
        if (!usersDB[user.email]) {
            usersDB[user.email] = { email: user.email, password: 'password', user };
            usersUpdated = true;
        }
    });
    if (usersUpdated) saveUsersDB(usersDB);

    // Merge Seed Servers into DB if missing
    const serversDB = getServersDB();
    let serversUpdated = false;
    SEED_SERVERS.forEach(server => {
        if (!serversDB[server.id]) {
            serversDB[server.id] = server;
            serversUpdated = true;
        }
    });
    if (serversUpdated) saveServersDB(serversDB);

    // Connect to socket
    socket.connect();

    // Listen for incoming messages
    socket.on('new_message', (data: { channelId: string, message: Message }) => {
      setState(prev => {
        const { channelId, message } = data;
        const currentMessages = prev.messages[channelId] || [];
        
        // Avoid duplicates
        if (currentMessages.some(m => m.id === message.id)) return prev;

        return {
          ...prev,
          messages: {
            ...prev.messages,
            [channelId]: [...currentMessages, message]
          }
        };
      });
    });

    // Listen for history
    socket.on('history', (data: { channelId: string, messages: Message[] }) => {
        setState(prev => ({
            ...prev,
            messages: {
                ...prev.messages,
                [data.channelId]: data.messages
            }
        }));
    });

    return () => {
      socket.off('new_message');
      socket.off('history');
      socket.disconnect();
    };
  }, []);

  // Join channel room on switch
  useEffect(() => {
    if (state.activeChannelId) {
        socket.emit('join_channel', state.activeChannelId);
    }
  }, [state.activeChannelId]);


  // Sync theme: Server Theme > User Profile Theme > Default
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

  // Global Click Effect
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
        const bubble = document.createElement('div');
        bubble.className = 'click-fx';
        bubble.style.left = `${e.pageX}px`;
        bubble.style.top = `${e.pageY}px`;
        document.body.appendChild(bubble);

        // Remove element after animation finishes
        setTimeout(() => {
            bubble.remove();
        }, 500);
    };

    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, []);

  // Ping Simulation
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

  // Load User and Servers on Mount
  useEffect(() => {
    const savedUser = localStorage.getItem('cc_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      
      // Load servers related to this user
      const db = getServersDB();
      const userServers = Object.values(db).filter(s => 
          s.memberRoles[parsedUser.id] || s.ownerId === parsedUser.id
      );

      setState(prev => ({ 
          ...prev, 
          currentUser: parsedUser,
          servers: userServers
      }));
    }
  }, []);

  // Modal ESC Listener
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
              if (state.isCreateServerOpen) setState(p => ({...p, isCreateServerOpen: false}));
              if (state.isCreateChannelOpen) setState(p => ({...p, isCreateChannelOpen: false}));
              if (state.isAddFriendOpen) {
                  setState(p => ({...p, isAddFriendOpen: false}));
                  setFriendSearchResults(null);
                  setFriendSearchQuery('');
              }
              if (state.isExploreOpen) setState(p => ({...p, isExploreOpen: false}));
              if (state.isServerInfoOpen) setState(p => ({...p, isServerInfoOpen: false}));
              if (state.viewingUserId) setState(p => ({...p, viewingUserId: null}));
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isCreateServerOpen, state.isCreateChannelOpen, state.isAddFriendOpen, state.isExploreOpen, state.isServerInfoOpen, state.viewingUserId]);


  const handleLogin = (user: User) => {
    localStorage.setItem('cc_user', JSON.stringify(user));
    
    // Load servers
    const db = getServersDB();
    const userServers = Object.values(db).filter(s => 
        s.memberRoles[user.id] || s.ownerId === user.id
    );

    setState(prev => ({ ...prev, currentUser: user, servers: userServers }));
  };

  const handleLogout = () => {
    localStorage.removeItem('cc_user');
    setState(prev => ({ ...prev, currentUser: null, isUserSettingsOpen: false, servers: [] }));
  };

  const handleUpdateUser = async (updates: Partial<User>): Promise<boolean | string> => {
    if (!state.currentUser) return false;
    
    const db = getUsersDB();
    const reserved = getReservedUsernames();
    const currentEmail = state.currentUser.email;

    if (updates.username && updates.username !== state.currentUser.username) {
       const lowerNew = updates.username.toLowerCase();
       const isTaken = Object.values(db).some((record: any) => 
         record.user.username.toLowerCase() === lowerNew && record.email !== currentEmail
       );
       if (isTaken) return "Identity claimed by another.";
       
       const now = Date.now();
       const validReserved = reserved.filter((r: any) => r.expiresAt > now);
       const isReserved = validReserved.some((r: any) => 
         r.username.toLowerCase() === lowerNew && r.originalOwnerId !== state.currentUser?.id
       );

       if (isReserved) return "Identity is under protection.";
    }

    if (updates.username && updates.username !== state.currentUser.username) {
       const oldUsername = state.currentUser.username;
       const reservation = {
         username: oldUsername,
         originalOwnerId: state.currentUser.id,
         expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
       };
       const newReservedList = reserved.filter((r: any) => r.username.toLowerCase() !== oldUsername.toLowerCase());
       newReservedList.push(reservation);
       saveReservedUsernames(newReservedList);
    }

    try {
      const userRecord = db[currentEmail];
      if (userRecord) {
        if (updates.email && updates.email !== currentEmail) {
           if (db[updates.email]) return "Correspondence already in use.";
           const newRecord = { ...userRecord, email: updates.email, user: { ...userRecord.user, ...updates } };
           delete db[currentEmail];
           db[updates.email] = newRecord;
        } else {
           userRecord.user = { ...userRecord.user, ...updates };
        }
        saveUsersDB(db);
      }

      const updatedUser = { ...state.currentUser, ...updates };
      localStorage.setItem('cc_user', JSON.stringify(updatedUser));
      setState(prev => ({ ...prev, currentUser: updatedUser }));

      return true;
    } catch (e) {
      return "Storage quota exceeded. Please reduce image sizes.";
    }
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

  const hasPermission = (userId: string, server: Server, permission: string): boolean => {
    if (server.ownerId === userId) return true;
    const roleIds = server.memberRoles[userId] || [];
    const userRoles = server.roles.filter(r => roleIds.includes(r.id));
    return userRoles.some(r => r.permissions.includes(permission as any));
  };

  const handleSendMessage = (content: string, replyToId?: string) => {
      if (!state.activeChannelId || !state.currentUser) return;

      const activeServer = state.servers.find(s => s.id === state.activeServerId);
      
      // Check permissions for @everyone if in a server
      if (activeServer && content.includes('@everyone')) {
        if (!hasPermission(state.currentUser.id, activeServer, 'MENTION_EVERYONE')) {
          alert("You do not have permission to summon everyone.");
          return; 
        }
      }

      const newMessage: Message = {
          id: 'm' + Date.now() + Math.random().toString(36).substr(2, 9),
          userId: state.currentUser.id,
          content,
          timestamp: Date.now(),
          replyToId,
          reactions: {} 
      };
      
      // Send to server instead of local state update
      socket.emit('send_message', {
          channelId: state.activeChannelId,
          message: newMessage
      });
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    if (!state.activeChannelId || !state.currentUser) return;
    
    setState(prev => {
        const channelMessages = prev.messages[prev.activeChannelId!] || [];
        const updatedMessages = channelMessages.map(msg => {
            if (msg.id === messageId) {
                const currentReactions = msg.reactions || {};
                const users = currentReactions[emoji] || [];
                let newUsers = [];
                
                if (users.includes(state.currentUser!.id)) {
                    newUsers = users.filter(id => id !== state.currentUser!.id);
                } else {
                    newUsers = [...users, state.currentUser!.id];
                }

                const newReactions = { ...currentReactions };
                if (newUsers.length > 0) {
                    newReactions[emoji] = newUsers;
                } else {
                    delete newReactions[emoji];
                }
                
                return { ...msg, reactions: newReactions };
            }
            return msg;
        });

        return {
            ...prev,
            messages: {
                ...prev.messages,
                [prev.activeChannelId!]: updatedMessages
            }
        };
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!state.activeChannelId) return;
    
    setState(prev => ({
        ...prev,
        messages: {
            ...prev.messages,
            [prev.activeChannelId!]: (prev.messages[prev.activeChannelId!] || []).filter(m => m.id !== messageId)
        }
    }));
  };

  const handleForwardMessage = (targetId: string, content: string) => {
      if (!state.currentUser) return;

      const forwardedContent = `[Forwarded] ${content}`;
      const newMessage: Message = {
          id: 'm' + Date.now(),
          userId: state.currentUser.id,
          content: forwardedContent,
          timestamp: Date.now(),
          reactions: {}
      };

      socket.emit('send_message', {
          channelId: targetId,
          message: newMessage
      });
      
      alert(`Message forwarded to target.`);
  };

  const handleSearchFriends = () => {
    if (!friendSearchQuery.trim()) return;
    
    const db = getUsersDB();
    const results = Object.values(db)
        .map((record: any) => record.user)
        .filter((u: User) => u.username.toLowerCase().includes(friendSearchQuery.toLowerCase()));

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

    setState(prev => ({
        ...prev,
        friends: [...prev.friends, targetUser],
        isAddFriendOpen: false
    }));
    setFriendSearchResults(null);
    setFriendSearchQuery('');
    alert(`Alliance formed with ${targetUser.username}.`);
  };

  const handleSendFriendRequest = (toUserId: string) => {
      alert("Alliance proposal dispatched.");
  };

  const handleAcceptFriendRequest = (userId: string, notificationId: string) => {
      const friend = MOCK_FRIENDS.find(u => u.id === userId) || { id: userId, username: 'New Friend', email: '', avatar: 'https://picsum.photos/100', status: 'online' };
      setState(prev => ({
          ...prev,
          friends: [...prev.friends, friend],
          notifications: prev.notifications.filter(n => n.id !== notificationId)
      }));
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
  };

  const updateActiveServer = (updates: Partial<Server>) => {
      if (!state.activeServerId) return;
      
      const db = getServersDB();
      const currentServer = db[state.activeServerId];
      if (!currentServer) return;

      const updatedServer = { ...currentServer, ...updates };
      db[state.activeServerId] = updatedServer;
      saveServersDB(db);

      // Force refresh of explore logic if public status changed
      if (updates.isPublic !== undefined) {
          setRefreshKey(prev => prev + 1);
      }

      setState(prev => ({
          ...prev,
          servers: prev.servers.map(s => s.id === prev.activeServerId ? updatedServer : s)
      }));
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
      isPublic: false, // Default private
      roles: [{ id: 'r_owner', name: 'Monarch', color: '#D4AF37', icon: '👑', permissions: ['MANAGE_SERVER', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'KICK_MEMBERS', 'SEND_MESSAGES', 'MENTION_EVERYONE'] }],
      memberRoles: { [state.currentUser.id]: ['r_owner'] },
      memberJoinedAt: { [state.currentUser.id]: Date.now() },
      channels: [
        { id: 'c' + Date.now(), name: 'throne-room', type: ChannelType.TEXT }
      ]
    };

    // Save to DB
    const db = getServersDB();
    db[newServer.id] = newServer;
    saveServersDB(db);

    setState(prev => ({
      ...prev,
      servers: [...prev.servers, newServer],
      isCreateServerOpen: false,
      activeServerId: newServer.id,
      activeChannelId: newServer.channels[0].id
    }));
    setNewServerName('');
  };

  // Join server via ID, Search, or Link
  const handleJoinServer = (queryOverride?: string) => {
      const query = queryOverride || joinServerQuery;
      if (!query.trim()) return;
      const db = getServersDB();
      const allServers = Object.values(db);
      
      // Try ID match first (parse link or direct ID)
      const potentialId = query.split('/').pop() || query;
      let targetServer = db[potentialId];

      // If not found, try name search
      if (!targetServer) {
          targetServer = allServers.find(s => s.name.toLowerCase() === query.toLowerCase());
      }

      if (targetServer) {
          if (state.servers.some(s => s.id === targetServer.id)) {
              // Already joined, just switch to it
              handleServerSelect(targetServer.id);
              setState(prev => ({ ...prev, isCreateServerOpen: false }));
              setJoinServerQuery('');
              return;
          }
          joinServer(targetServer);
          setState(prev => ({ ...prev, isCreateServerOpen: false }));
          setJoinServerQuery('');
      } else {
          alert("Realm not found in the archives.");
      }
  };

  const joinServer = (server: Server) => {
      if (!state.currentUser) return;
      
      // Update DB
      const db = getServersDB();
      const serverInDb = db[server.id];
      if (serverInDb) {
          // Add default role if any, or just add to members
          serverInDb.memberJoinedAt[state.currentUser.id] = Date.now();
          
          saveServersDB(db);
          
          setState(prev => ({
              ...prev,
              servers: [...prev.servers, serverInDb],
              activeServerId: server.id,
              activeChannelId: serverInDb.channels[0]?.id || null,
              isExploreOpen: false
          }));
      }
  };

  const createChannel = () => {
    if (!newChannelName.trim() || !state.activeServerId) return;
    
    const newChannel: Channel = {
      id: 'c' + Date.now(),
      name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
      type: createChannelType
    };

    // Update DB
    const db = getServersDB();
    const currentServer = db[state.activeServerId];
    if (currentServer) {
        currentServer.channels.push(newChannel);
        saveServersDB(db);

        setState(prev => ({
            ...prev,
            servers: prev.servers.map(s => s.id === prev.activeServerId ? currentServer : s),
            isCreateChannelOpen: false,
            activeChannelId: newChannel.id
        }));
    }
    setNewChannelName('');
  };

  const activeServer = state.servers.find(s => s.id === state.activeServerId) || null;
  const activeChannel = activeServer?.channels.find(c => c.id === state.activeChannelId) || null;
  const activeMessages = state.activeChannelId ? (state.messages[state.activeChannelId] || []) : [];

  // Determine if we are in a DM
  const isDM = !state.activeServerId && state.activeChannelId && state.activeChannelId.startsWith('dm_');
  let currentChannelName = activeChannel?.name || 'Unknown';
  if (isDM) {
      const dmFriendId = state.activeChannelId!.replace('dm_', '');
      const friend = state.friends.find(f => f.id === dmFriendId);
      currentChannelName = friend?.username || 'Private Chat';
  }

  // Combine all known users for lookup
  const allKnownUsers = state.currentUser ? [state.currentUser, ...state.friends, ...SEED_USERS] : [];

  if (!state.currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  // Helper to get active call participants (excluding self)
  const getCallParticipants = () => {
      if (!state.activeChannelId) return [];
      
      if (state.activeChannelId.startsWith('dm_')) {
          const friendId = state.activeChannelId.replace('dm_', '');
          return state.friends.filter(f => f.id === friendId);
      }
      return [];
  };

  // Explore Logic - Re-read DB on render or when forced
  const allServers = Object.values(getServersDB());
  // If no servers in DB yet, fallback to seed
  const potentialServers = allServers.length > 0 ? allServers : SEED_SERVERS;
  // Show all public servers, regardless of membership (for visual confirmation)
  const publicServers = potentialServers.filter(s => s.isPublic);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-theme-bg text-theme-text select-none antialiased font-['Inter']">
      
      {/* Mobile Navigation Drawer */}
      <div className={`fixed inset-0 z-40 flex md:static md:flex ${showMobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} transition-transform duration-300 bg-black/90 md:bg-transparent backdrop-blur md:backdrop-blur-none`}>
        <Sidebar 
            servers={state.servers} 
            activeServerId={state.activeServerId} 
            onServerSelect={(id) => { handleServerSelect(id); setShowMobileMenu(false); }} 
            onAddServer={() => { setState(prev => ({ ...prev, isCreateServerOpen: true })); setShowMobileMenu(false); }}
            onExplore={() => { setState(prev => ({ ...prev, isExploreOpen: true, activeServerId: null })); setShowMobileMenu(false); setRefreshKey(prev => prev + 1); }}
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
        {/* Overlay click to close on mobile */}
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
              {publicServers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                    {publicServers.map(server => {
                        const isMember = state.servers.some(s => s.id === server.id);
                        return (
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
                        {isMember ? (
                            <button 
                                onClick={() => handleServerSelect(server.id)}
                                className="w-full py-3 bg-white/5 border border-theme-gold text-theme-gold font-bold uppercase text-xs tracking-widest transition-all royal-font mt-auto hover:bg-theme-gold hover:text-black"
                            >
                                Enter Realm
                            </button>
                        ) : (
                            <button 
                                onClick={() => joinServer(server)} 
                                className="w-full py-3 bg-theme-panel border border-theme-border text-theme-text-muted group-hover:bg-theme-gold group-hover:text-black font-bold uppercase text-xs tracking-widest transition-all royal-font mt-auto"
                            >
                                Pledge Loyalty
                            </button>
                        )}
                      </div>
                    )})}
                  </div>
              ) : (
                  <div className="flex items-center justify-center h-64 text-theme-text-muted text-lg italic">
                     No public realms found.
                  </div>
              )}
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
              onDeleteMessage={handleDeleteMessage}
              onForwardMessage={handleForwardMessage}
              onViewUser={(userId) => setState(prev => ({ ...prev, viewingUserId: userId }))}
              onAcceptFriendRequest={handleAcceptFriendRequest}
              onRejectFriendRequest={handleRejectFriendRequest}
              onCall={isDM ? (type) => setState(prev => ({ ...prev, isCallActive: true, callType: type as any })) : undefined}
              onAddReaction={handleAddReaction}
              onToggleMobileMenu={() => setShowMobileMenu(true)}
              onJoinServer={(link) => handleJoinServer(link)} // NEW: Handle link joins
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
          allUsers={[state.currentUser!, ...state.friends]}
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
          members={[state.currentUser!, ...state.friends]}
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
                        <p className="text-xs text-theme-text-dim text-center mb-6">Enter an invite link, ID, or search by name to join a realm.</p>
                        <input autoFocus className="w-full bg-theme-bg border border-theme-border p-4 text-theme-text font-medium mb-8 focus:outline-none focus:border-theme-gold transition-all" placeholder="Invite Link or Server Name" value={joinServerQuery} onChange={e => setJoinServerQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleJoinServer()} />
                        <div className="flex justify-end gap-4">
                        <button onClick={() => setState(prev => ({ ...prev, isCreateServerOpen: false }))} className="font-bold text-theme-text-dim hover:text-theme-gold transition-colors uppercase text-xs tracking-widest royal-font">Retreat</button>
                        <button onClick={() => handleJoinServer()} className="px-8 py-3 bg-theme-gold text-black font-bold uppercase text-xs tracking-widest hover:brightness-110 transition-all royal-font">Join</button>
                        </div>
                    </>
                )}
              </>
            )}
            
            {/* ... other modals (createChannel, addFriend) remain the same ... */}
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
                <div className="mb-6">
                    <p className="text-xs text-theme-text-dim mb-2 text-center">Enter identity to search the archives.</p>
                </div>
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
