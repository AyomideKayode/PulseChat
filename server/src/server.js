import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';

// Route imports
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import { connectDB } from './lib/db.js';
import { ENV } from './lib/env.js';

const app = express();
const PORT = ENV.PORT || 3000;
const __dirname = path.resolve();

// Middleware for parsing JSON bodies
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
// Middleware for parsing cookies
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Serve static files from the React frontend app
if (ENV.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  // Handle React routing, return all requests to React app
  app.get('*path', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'dist', 'index.html'));
  });
} else {
  // In development, you'll likely run Vite on a separate port (5173)
  app.get('/', (req, res) => {
    res.send(
      'API is running in development mode. Please run the Vite dev server.'
    );
  });
}

try {
  // 1. Establish the "source of truth" first
  await connectDB();

  // 2. Only then open the gates to users
  app.listen(PORT, () => {
    console.log(`💫 PulseChat is running on: http://localhost:${PORT}`);
  });
} catch (error) {
  console.error('Failed to start PulseChat:', error);
  process.exit(1);
}
