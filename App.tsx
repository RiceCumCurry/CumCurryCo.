
import React, { useState, useEffect } from 'react';
import { AppState, User, Server, ChannelType, Channel, Message, Role, Notification } from './types';
import { MOCK_SERVERS, MOCK_FRIENDS, ICONS } from './constants';
import Sidebar from './components/Sidebar';
import ChannelBar from './components/ChannelBar';
import ChatArea from './components/ChatArea';
import Auth from './components/Auth';
import CallScreen from './components/CallScreen';
import ServerSettings from './components/ServerSettings';
import UserSettings from './components/UserSettings';
import ServerInfoModal from './components/ServerInfoModal';
import UserProfileModal from './components/UserProfileModal';

// Database Helper functions
const getUsersDB = () => {
  const db = localStorage.getItem('cc_users_db');
  return db ? JSON.parse(db) : {};
};

const getReservedUsernames = () => {
  const db = localStorage.getItem('cc_reserved_usernames');
  return db ? JSON.parse(db) : [];
};

const saveUsersDB = (db: any) => localStorage.setItem('cc_users_db', JSON.stringify(db));
const saveReservedUsernames = (db: any) => localStorage.setItem('cc_reserved_usernames', JSON.stringify(db));

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    servers: MOCK_SERVERS.map(s => ({
        ...s,
        ownerId: 'u2',
        theme: 'fiery',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30, // 30 days ago
        roles: [
            { id: 'r1', name: 'admin', color: '#D4AF37', permissions: ['MANAGE_SERVER', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'KICK_MEMBERS', 'SEND_MESSAGES', 'MENTION_EVERYONE'] },
            { id: 'r2', name: 'moderator', color: '#B8860B', permissions: ['MANAGE_CHANNELS', 'KICK_MEMBERS', 'SEND_MESSAGES', 'MENTION_EVERYONE'] },
            { id: 'r3', name: 'member', color: '#A9A9A9', permissions: ['SEND_MESSAGES'] }
        ],
        memberRoles: {
            'u2': ['r1'],
            'u3': ['r2'],
            'u4': ['r3']
        },
        memberJoinedAt: {
          'u2': Date.now() - 1000 * 60 * 60 * 24 * 30,
          'u3': Date.now() - 1000 * 60 * 60 * 24 * 10,
          'u4': Date.now() - 1000 * 60 * 60 * 24 * 2,
        }
    })),
    activeServerId: 's1',
    activeChannelId: 'c1',
    messages: {
        'c1': [{ id: 'm1', userId: 'u2', content: 'Peace be upon this realm.', timestamp: Date.now() - 100000 }],
        'c2': [{ id: 'm2', userId: 'u3', content: 'Anyone wish to engage in combat?', timestamp: Date.now() - 50000 }]
    },
    friends: MOCK_FRIENDS,
    notifications: [
        { id: 'n1', type: 'SYSTEM', content: 'Welcome to CumCurry, noble traveler.', read: false, timestamp: Date.now() },
        { id: 'n2', type: 'FRIEND_REQUEST', content: 'FragMaster wishes to form an alliance.', fromUserId: 'u3', read: false, timestamp: Date.now() - 10000 }
    ],
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
  const [newChannelName, setNewChannelName] = useState('');

  // Update HTML data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'royal');
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

  useEffect(() => {
    const savedUser = localStorage.getItem('cc_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setState(prev => ({ 
          ...prev, 
          currentUser: parsed,
          servers: prev.servers.map(s => s.id === 's1' ? { ...s, ownerId: parsed.id } : s)
      }));
    }
  }, []);

  const handleLogin = (user: User) => {
    localStorage.setItem('cc_user', JSON.stringify(user));
    setState(prev => ({ ...prev, currentUser: user, servers: prev.servers.map(s => ({ ...s, ownerId: user.id })) }));
  };

  const handleLogout = () => {
    localStorage.removeItem('cc_user');
    setState(prev => ({ ...prev, currentUser: null, isUserSettingsOpen: false }));
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

  const handleSendMessage = (content: string) => {
      if (!state.activeChannelId || !state.currentUser) return;

      const activeServer = state.servers.find(s => s.id === state.activeServerId);
      
      // Check permissions for @everyone
      if (content.includes('@everyone')) {
        if (activeServer && !hasPermission(state.currentUser.id, activeServer, 'MENTION_EVERYONE')) {
          // In a real app we might block it, here we will just alert and not send, or strip it.
          // For demo purposes, let's just alert.
          alert("You do not have permission to summon everyone.");
          return; 
        }
      }

      const newMessage: Message = {
          id: 'm' + Date.now(),
          userId: state.currentUser.id,
          content,
          timestamp: Date.now()
      };
      
      // Simulate mention notification for demo
      let newNotifications = [...state.notifications];
      if (content.includes('@')) {
          newNotifications.push({
              id: 'n' + Date.now(),
              type: 'MENTION',
              content: `${state.currentUser.username} mentioned you in #${activeChannel?.name}`,
              fromUserId: state.currentUser.id,
              read: false,
              timestamp: Date.now()
          });
      }

      setState(prev => ({
          ...prev,
          messages: {
              ...prev.messages,
              [prev.activeChannelId!]: [...(prev.messages[prev.activeChannelId!] || []), newMessage]
          },
          notifications: newNotifications
      }));
  };

  const handleSendFriendRequest = (toUserId: string) => {
      // In a real app, this would send an API request
      // For demo, we just add a notification to the local state (simulating receiver for now, or just alert)
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

  const updateActiveServer = (updates: Partial<Server>) => {
      if (!state.activeServerId) return;
      setState(prev => ({
          ...prev,
          servers: prev.servers.map(s => s.id === prev.activeServerId ? { ...s, ...updates } : s)
      }));
  };

  const createServer = () => {
    if (!newServerName.trim() || !state.currentUser) return;
    const newServer: Server = {
      id: 's' + Date.now(),
      name: newServerName,
      icon: `https://picsum.photos/seed/${newServerName}/100/100`,
      ownerId: state.currentUser.id,
      createdAt: Date.now(),
      theme: 'fiery',
      roles: [{ id: 'r_owner', name: 'Monarch', color: '#D4AF37', permissions: ['MANAGE_SERVER', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'KICK_MEMBERS', 'SEND_MESSAGES', 'MENTION_EVERYONE'] }],
      memberRoles: { [state.currentUser.id]: ['r_owner'] },
      memberJoinedAt: { [state.currentUser.id]: Date.now() },
      channels: [
        { id: 'c' + Date.now(), name: 'throne-room', type: ChannelType.TEXT }
      ]
    };
    setState(prev => ({
      ...prev,
      servers: [...prev.servers, newServer],
      isCreateServerOpen: false,
      activeServerId: newServer.id,
      activeChannelId: newServer.channels[0].id
    }));
    setNewServerName('');
  };

  const createChannel = () => {
    if (!newChannelName.trim() || !state.activeServerId) return;
    const newChannel: Channel = {
      id: 'c' + Date.now(),
      name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
      type: ChannelType.TEXT
    };
    setState(prev => ({
      ...prev,
      servers: prev.servers.map(s => s.id === prev.activeServerId ? { ...s, channels: [...s.channels, newChannel] } : s),
      isCreateChannelOpen: false,
      activeChannelId: newChannel.id
    }));
    setNewChannelName('');
  };

  const activeServer = state.servers.find(s => s.id === state.activeServerId) || null;
  const activeChannel = activeServer?.channels.find(c => c.id === state.activeChannelId) || null;
  const activeMessages = state.activeChannelId ? (state.messages[state.activeChannelId] || []) : [];

  // Combine all known users for lookup
  const allKnownUsers = state.currentUser ? [state.currentUser, ...state.friends] : [];

  if (!state.currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050505] text-[#F5F5DC] select-none antialiased font-['Inter']">
      <Sidebar 
        servers={state.servers} 
        activeServerId={state.activeServerId} 
        onServerSelect={handleServerSelect} 
        onAddServer={() => setState(prev => ({ ...prev, isCreateServerOpen: true }))}
        onExplore={() => setState(prev => ({ ...prev, isExploreOpen: true, activeServerId: null }))}
      />
      
      <div className="flex flex-1">
        <ChannelBar 
          server={activeServer}
          friends={state.friends}
          activeChannelId={state.activeChannelId}
          currentUser={state.currentUser}
          onChannelSelect={(id) => setState(prev => ({ ...prev, activeChannelId: id }))}
          onCall={(type) => setState(prev => ({ ...prev, isCallActive: true, callType: type as any }))}
          noiseThreshold={state.noiseThreshold}
          isMicMuted={state.isMicMuted}
          ping={state.ping}
          connectionStatus={state.connectionStatus}
          onSettingsChange={(settings) => setState(prev => ({ ...prev, ...settings }))}
          onCreateChannel={() => setState(prev => ({ ...prev, isCreateChannelOpen: true }))}
          onOpenSettings={() => setState(prev => ({ ...prev, isServerSettingsOpen: true }))}
          onOpenServerInfo={() => setState(prev => ({ ...prev, isServerInfoOpen: true }))}
          onOpenUserSettings={() => setState(prev => ({ ...prev, isUserSettingsOpen: true }))}
          onUpdateUser={handleUpdateUser}
        />
        
        <main className="flex-1 flex flex-col relative bg-[#050505]">
          {state.isExploreOpen ? (
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar animate-in fade-in duration-300 mandala-bg">
              <h1 className="text-4xl royal-font font-bold mb-10 text-[#D4AF37] uppercase tracking-widest text-center border-b border-[#3d2b0f] pb-6">Kingdoms of the Realm</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {['Royal Guard', 'Arcane Sanctum', 'Merchants Guild', 'Gladiator Pit'].map(name => (
                  <div key={name} className="bg-[#0a0a0a] border border-[#3d2b0f] p-4 shadow-xl hover:border-[#D4AF37] transition-all group cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img src={`https://picsum.photos/seed/${name}/400/200`} className="w-full h-40 object-cover mb-4 sepia-[0.5] group-hover:sepia-0 transition-all" />
                    <h3 className="font-bold text-lg mb-2 uppercase tracking-wide text-[#F4C430] royal-font">{name}</h3>
                    <button onClick={() => { setNewServerName(name); createServer(); setState(prev => ({ ...prev, isExploreOpen: false })); }} className="w-full py-3 bg-[#1a1a1a] text-[#8a7038] group-hover:bg-[#D4AF37] group-hover:text-black font-bold uppercase text-xs tracking-widest transition-all royal-font">Pledge Loyalty</button>
                  </div>
                ))}
              </div>
            </div>
          ) : activeChannel ? (
            <ChatArea 
              channelName={activeChannel.name} 
              currentUser={state.currentUser} 
              messages={activeMessages}
              notifications={state.notifications}
              allUsers={allKnownUsers}
              server={activeServer}
              onSendMessage={handleSendMessage}
              onViewUser={(userId) => setState(prev => ({ ...prev, viewingUserId: userId }))}
              onAcceptFriendRequest={handleAcceptFriendRequest}
              onRejectFriendRequest={handleRejectFriendRequest}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 bg-[#050505] mandala-bg">
               <div className="text-center opacity-50">
                  <div className="w-24 h-24 rounded-full border-2 border-[#D4AF37] flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl text-[#D4AF37]">⚜️</span>
                  </div>
                  <h1 className="text-3xl royal-font font-bold uppercase text-[#8a7038] tracking-widest">Awaiting Command</h1>
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
          onEditProfile={() => setState(prev => ({ ...prev, viewingUserId: null, isUserSettingsOpen: true }))}
        />
      )}

      {/* Basic Modals */}
      {(state.isCreateServerOpen || state.isCreateChannelOpen || state.isAddFriendOpen) && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-[#5c4010] p-10 shadow-2xl relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37]" />
            {state.isCreateServerOpen && (
              <>
                <h2 className="text-2xl royal-font font-bold mb-6 uppercase tracking-widest text-[#F4C430] text-center">New Dominion</h2>
                <input autoFocus className="w-full bg-[#050505] border border-[#3d2b0f] p-4 text-[#F5F5DC] font-medium mb-8 focus:outline-none focus:border-[#D4AF37] transition-all" placeholder="Kingdom Name" value={newServerName} onChange={e => setNewServerName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createServer()} />
                <div className="flex justify-end gap-4">
                  <button onClick={() => setState(prev => ({ ...prev, isCreateServerOpen: false }))} className="font-bold text-[#5c4010] hover:text-[#D4AF37] transition-colors uppercase text-xs tracking-widest royal-font">Retreat</button>
                  <button onClick={createServer} className="px-8 py-3 bg-[#D4AF37] text-black font-bold uppercase text-xs tracking-widest hover:brightness-110 transition-all royal-font">Found</button>
                </div>
              </>
            )}
            {state.isCreateChannelOpen && (
              <>
                <h2 className="text-2xl royal-font font-bold mb-6 uppercase tracking-widest text-[#F4C430] text-center">New Chamber</h2>
                <input autoFocus className="w-full bg-[#050505] border border-[#3d2b0f] p-4 text-[#F5F5DC] font-medium mb-8 focus:outline-none focus:border-[#D4AF37] transition-all" placeholder="Chamber Title" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createChannel()} />
                <div className="flex justify-end gap-4">
                  <button onClick={() => setState(prev => ({ ...prev, isCreateChannelOpen: false }))} className="font-bold text-[#5c4010] hover:text-[#D4AF37] transition-colors uppercase text-xs tracking-widest royal-font">Retreat</button>
                  <button onClick={createChannel} className="px-8 py-3 bg-[#D4AF37] text-black font-bold uppercase text-xs tracking-widest hover:brightness-110 transition-all royal-font">Construct</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {state.isCallActive && state.callType && (
        <CallScreen type={state.callType} participants={state.friends.slice(0, 2)} onDisconnect={() => setState(prev => ({ ...prev, isCallActive: false, callType: null }))} />
      )}
    </div>
  );
};

export default App;
