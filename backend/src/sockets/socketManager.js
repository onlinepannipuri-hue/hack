import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/tokens.js';
import { User } from '../models/User.js';

let io = null;

export const initSocket = (httpServer, clientUrl) => {
  io = new Server(httpServer, {
    cors: {
      origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1] ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication token required for WebSocket connection'));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('User account not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.warn(`[Socket Auth Warning]: Connection rejected (${err.message})`);
      next(new Error('Invalid or expired socket authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    const userRoom = `user:${userId}`;

    // Join isolated user room
    socket.join(userRoom);
    console.log(`[Socket] Client connected: socket ${socket.id} joined room ${userRoom}`);

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: socket ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};

/**
 * Emit real-time new SMS event strictly to the specific user's private room
 */
export const emitNewSmsToUser = (userId, message) => {
  if (!io) return;
  const userRoom = `user:${userId.toString()}`;
  io.to(userRoom).emit('sms:new', message);
};

/**
 * Emit sync completion notification to the specific user's private room
 */
export const emitSyncCompleteToUser = (userId, syncSummary) => {
  if (!io) return;
  const userRoom = `user:${userId.toString()}`;
  io.to(userRoom).emit('sms:sync_complete', syncSummary);
};

/**
 * Emit device status update to the specific user's private room
 */
export const emitDeviceUpdateToUser = (userId, deviceData) => {
  if (!io) return;
  const userRoom = `user:${userId.toString()}`;
  io.to(userRoom).emit('device:update', deviceData);
};
