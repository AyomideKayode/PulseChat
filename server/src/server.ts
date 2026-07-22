// server/src/server.ts

import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';

import helmet from 'helmet';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import conversationRoutes from './routes/conversation.route.js';
import { connectDB } from './lib/db.js';
import { ENV } from './lib/env.js';
import { setupSocket } from './socket/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const PORT = ENV.PORT || 5000;

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(helmet());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);

const io = new Server(httpServer, {
  cors: {
    origin: ENV.CLIENT_URL,
    credentials: true,
  },
});

setupSocket(io);

// Serve static frontend in production
if (ENV.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.send('PulseChat API is running in development mode.');
  });
}

try {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`PulseChat running on port ${PORT}`);
  });
} catch (error) {
  console.error('Failed to start PulseChat:', error);
  process.exit(1);
}
