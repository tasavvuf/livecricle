import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { authenticateSocket } from './middleware/auth';
import { registerLocationSocketHandlers } from './sockets/location';
import authRoutes from './routes/auth';
import groupRoutes from './routes/groups';
import meRoutes from './routes/me';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/livecircle';

// Middlewares
app.use(cors());
app.use(express.json());

// Request logging in development
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// REST Routes
app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/me', meRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LiveCircle Server',
    time: new Date().toISOString(),
    mongoState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.json({
    name: 'LiveCircle API Server',
    description: 'Real-time group location with geofence notifications and Socket.io',
    version: '1.0.0',
    status: 'healthy',
  });
});

// Socket.io configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Socket authentication middleware
io.use((socket, next) => {
  authenticateSocket(socket as any, next);
});

// Register real-time tracking and geofence events
registerLocationSocketHandlers(io);

// MongoDB connection with automated memory fallback
async function connectDatabase() {
  try {
    console.log(`[Database] Attempting connection to ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    console.log('[Database] Successfully connected to MongoDB');
  } catch (initialErr) {
    console.warn('[Database] Local/Configured MongoDB connection failed. Initializing MongoMemoryServer fallback...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`[Database] Connected to in-memory MongoDB at ${uri}`);
    } catch (memErr) {
      console.error('[Database Fatal] Failed to start both configured and in-memory MongoDB:', memErr);
      process.exit(1);
    }
  }
}

connectDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  LiveCircle Server listening on port ${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/health`);
    console.log(`========================================\n`);
  });
});

export { app, server, io };
