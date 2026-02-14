
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
// Allow CORS for dev purposes
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;

// --- Data Stores (The "Host Server" Database) ---
const users = {}; // userId -> User
const credentials = {}; // email -> { password, userId }
const servers = {}; // serverId -> Server
const friends = {}; // userId -> [friendId]
const notifications = {}; // userId -> [Notification]
const messages = {}; // channelId -> Message[]
const connectedUsers = {}; // userId -> socketId

// --- Seeds ---
const SEED_USERS = [
  { id: 'u_arthur', username: 'Arthur', email: 'king@camelot.co', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop', status: 'online', customStatus: 'Pulling swords from stones' },
  { id: 'u_merlin', username: 'Merlin', email: 'wizard@magic.co', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop', status: 'dnd', customStatus: 'Pondering the orb' },
  { id: 'u_guinevere', username: 'Gwen', email: 'queen@royal.co', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', status: 'idle' },
  { id: 'u_lancelot', username: 'Lancelot', email: 'lance@knight.co', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', status: 'online' },
];

const SEED_SERVERS = [
  {
    id: 's_camelot',
    name: 'Camelot',
    icon: 'https://images.unsplash.com/photo-1599707367072-cd6ad6cb3d2e?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1533158388470-9a56699990c6?w=800&h=200&fit=crop',
    ownerId: 'u_arthur',
    createdAt: Date.now(),
    theme: 'royal',
    isPublic: true,
    roles: [
      { id: 'r_king', name: 'Sovereign', color: '#D4AF37', icon: '👑', permissions: ['MANAGE_SERVER', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'KICK_MEMBERS', 'SEND_MESSAGES', 'MENTION_EVERYONE'] },
      { id: 'r_knight', name: 'Knight', color: '#C0C0C0', icon: '⚔️', permissions: ['SEND_MESSAGES'] }
    ],
    memberRoles: { 'u_arthur': ['r_king'], 'u_lancelot': ['r_knight'] },
    memberJoinedAt: { 'u_arthur': Date.now(), 'u_lancelot': Date.now() },
    channels: [
      { id: 'c_roundtable', name: 'round-table', type: 'TEXT' },
      { id: 'c_strategy', name: 'war-room', type: 'VOICE' }
    ]
  },
  {
    id: 's_avalon',
    name: 'Avalon',
    icon: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&h=200&fit=crop',
    ownerId: 'u_merlin',
    createdAt: Date.now(),
    theme: 'prismatic',
    isPublic: true,
    roles: [],
    memberRoles: { 'u_merlin': [] },
    memberJoinedAt: { 'u_merlin': Date.now() },
    channels: [
      { id: 'c_spells', name: 'spell-casting', type: 'TEXT' },
      { id: 'c_visions', name: 'crystal-ball', type: 'VIDEO' }
    ]
  }
];

// Initialize Seeds
SEED_USERS.forEach(u => {
  users[u.id] = u;
  credentials[u.email] = { password: 'password', userId: u.id }; // Default password for seeds
});

SEED_SERVERS.forEach(s => {
  servers[s.id] = s;
});

// Helper
const broadcastUserUpdate = (user) => {
  io.emit('user:updated', user);
};

const broadcastServerUpdate = (server) => {
  io.emit('server:updated', server);
};

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // --- Auth Handlers ---
  socket.on('auth:login', ({ email, password }, callback) => {
    const cred = credentials[email];
    if (cred && cred.password === password) {
      const user = users[cred.userId];
      connectedUsers[user.id] = socket.id;
      callback({ success: true, user });
    } else {
      callback({ success: false, error: "Invalid credentials" });
    }
  });

  socket.on('auth:register', ({ email, password, username }, callback) => {
    if (credentials[email]) {
      return callback({ success: false, error: "Email already registered." });
    }
    const newUser = {
      id: 'u_' + Date.now(),
      username,
      email,
      avatar: `https://picsum.photos/seed/${username}/200/200`,
      status: 'online'
    };
    users[newUser.id] = newUser;
    credentials[email] = { password, userId: newUser.id };
    connectedUsers[newUser.id] = socket.id;
    
    // Broadcast existence of new user to everyone (so they can be searched)
    broadcastUserUpdate(newUser);
    
    callback({ success: true, user: newUser });
  });

  // --- Data Sync ---
  socket.on('data:sync', ({ userId }, callback) => {
    const user = users[userId];
    if (!user) return callback({ error: "User not found" });

    // Update socket mapping
    connectedUsers[userId] = socket.id;

    const userServers = Object.values(servers).filter(s => 
      s.memberJoinedAt && (s.memberJoinedAt[userId] || s.ownerId === userId)
    );
    
    const userFriendIds = friends[userId] || [];
    const userFriends = userFriendIds.map(fid => users[fid]).filter(Boolean);
    const userNotifs = notifications[userId] || [];
    const allUsers = Object.values(users);

    callback({
      servers: userServers,
      friends: userFriends,
      notifications: userNotifs,
      allUsers: allUsers,
      user: user // Return latest user state
    });
  });

  // --- Server Management ---
  socket.on('server:create', (serverData, callback) => {
    servers[serverData.id] = serverData;
    callback({ success: true });
    // If public, broadcast to everyone for discovery? 
    // Or just let them discover via search which reads from `servers`
  });

  socket.on('server:join', ({ serverId, userId }) => {
    const server = servers[serverId];
    if (server) {
      if (!server.memberJoinedAt) server.memberJoinedAt = {};
      if (!server.memberRoles) server.memberRoles = {};
      
      server.memberJoinedAt[userId] = Date.now();
      // Broadcast update to all clients to refresh their view of this server
      broadcastServerUpdate(server);
      // Join socket room
      socket.join(serverId);
    }
  });

  socket.on('server:update', ({ serverId, updates }) => {
    const server = servers[serverId];
    if (server) {
      Object.assign(server, updates);
      servers[serverId] = server;
      broadcastServerUpdate(server);
    }
  });

  // --- User Management ---
  socket.on('user:update', ({ userId, updates }, callback) => {
    const user = users[userId];
    if (user) {
      Object.assign(user, updates);
      users[userId] = user;
      
      // Update credentials if email changed
      if (updates.email) {
        // Find old email key
        const oldEmail = Object.keys(credentials).find(e => credentials[e].userId === userId);
        if (oldEmail && oldEmail !== updates.email) {
           credentials[updates.email] = credentials[oldEmail];
           delete credentials[oldEmail];
        }
      }

      broadcastUserUpdate(user);
      callback({ success: true });
    } else {
      callback({ success: false, error: "User not found" });
    }
  });

  // --- Messaging ---
  socket.on('join_channel', (channelId) => {
    socket.join(channelId);
    if (messages[channelId]) {
      socket.emit('history', { channelId, messages: messages[channelId] });
    }
  });

  socket.on('send_message', (data) => {
    const { channelId, message } = data;
    if (!messages[channelId]) messages[channelId] = [];
    
    messages[channelId].push(message);
    if (messages[channelId].length > 50) messages[channelId].shift(); // Keep last 50

    io.to(channelId).emit('new_message', { channelId, message });
  });

  // --- Friends ---
  socket.on('friend:request', ({ fromUserId, toUserId }) => {
    const targetSocket = connectedUsers[toUserId];
    const newNotif = {
        id: 'notif_' + Date.now(),
        type: 'FRIEND_REQUEST',
        fromUserId: fromUserId,
        content: `${users[fromUserId].username} seeks an alliance!`,
        read: false,
        timestamp: Date.now()
    };

    if (!notifications[toUserId]) notifications[toUserId] = [];
    notifications[toUserId].push(newNotif);

    if (targetSocket) {
      io.to(targetSocket).emit('friend_request_received', newNotif);
    }
  });

  socket.on('friend:accept', ({ userId, friendId }) => {
    // Add bidirectional friendship
    if (!friends[userId]) friends[userId] = [];
    if (!friends[friendId]) friends[friendId] = [];

    if (!friends[userId].includes(friendId)) friends[userId].push(friendId);
    if (!friends[friendId].includes(userId)) friends[friendId].push(userId);

    // Notify requester
    const targetSocket = connectedUsers[friendId];
    if (targetSocket) {
      io.to(targetSocket).emit('friend_request_accepted', { user: users[userId] });
    }
  });

  socket.on('disconnect', () => {
    const userId = Object.keys(connectedUsers).find(key => connectedUsers[key] === socket.id);
    if (userId) {
       // Optional: Set user status to offline?
       // users[userId].status = 'offline';
       // broadcastUserUpdate(users[userId]);
       delete connectedUsers[userId];
    }
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Socket.io Server running on port ${PORT}`);
});
