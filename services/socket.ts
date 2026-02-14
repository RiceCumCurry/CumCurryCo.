
import { io } from 'socket.io-client';

// Connect to the relative path. Vite proxy will handle forwarding to localhost:3001
export const socket = io({
  autoConnect: false
});
