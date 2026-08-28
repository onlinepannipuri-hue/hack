import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './sockets/socketManager.js';
import { auditLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import smsRoutes from './routes/smsRoutes.js';

const app = express();
const server = http.createServer(app);

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow mobile apps (origin is undefined) and web dashboard
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(auditLogger);

// Initialize WebSockets
initSocket(server, ENV.CLIENT_URL);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Secure SMS Dashboard API',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/sms', smsRoutes);

// Centralized error handler
app.use(errorHandler);

// Connect Database and Start Server
export const startServer = async (port = ENV.PORT) => {
  await connectDB();

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`[Server] Secure SMS Dashboard Backend running on port ${port}`);
      console.log(`[Server] Environment: ${ENV.NODE_ENV}`);
      resolve(server);
    });
  });
};

if (process.env.NODE_ENV !== 'test' && !process.argv[1]?.includes('api.test.js')) {
  startServer();
}

export { app, server };

