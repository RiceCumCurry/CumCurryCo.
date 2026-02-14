
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
// Allow CORS for dev purposes, though Vite proxy handles local dev
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;

// In-memory store for demo purposes
// In a real app, this would be a database
const messages = {}; // channelId -> Message[]

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_channel', (channelId) => {
    socket.join(channelId);
    // Send existing history for this channel
    if (messages[channelId]) {
      socket.emit('history', { channelId, messages: messages[channelId] });
    }
  });

  socket.on('send_message', (data) => {
    // data: { channelId, message }
    const { channelId, message } = data;
    
    if (!messages[channelId]) {
      messages[channelId] = [];
    }
    
    // Store message
    messages[channelId].push(message);
    
    // Limit history per channel to 50 for performance
    if (messages[channelId].length > 50) {
      messages[channelId].shift();
    }

    // Broadcast to everyone in the channel including sender
    io.to(channelId).emit('new_message', { channelId, message });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Socket.io Server running on port ${PORT}`);
});
