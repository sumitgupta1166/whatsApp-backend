import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB } from './db/index.js';
import apiRoutes from './routes/api.routes.js';
import chatRoutes from './routes/chat.routes.js';
import { initSocket } from './sockets/socket.js';
import dotenv from 'dotenv';
import cors from 'cors';
import errorHandler from './middlewares/errorhandler.middleware.js';

dotenv.config({ path: './.env' });

const PORT = process.env.PORT || 3000;

const startApp = async () => {
  try {
    await connectDB();

    const app = express();
    const httpServer = createServer(app);

    // CORS - allow frontend origin (adjust as needed)
    app.use(cors({
      origin: process.env.FRONTEND_ORIGIN || "*",
      credentials: true
    }));

    app.use(express.json());

    // Root route for Vercel & health check
    app.get("/", (req, res) => {
      res.send("Backend API is running");
    });

    // API routes
    app.use('/api', apiRoutes);
    app.use('/api', chatRoutes); // alias routes for frontend compatibility

    // Socket.io
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    initSocket(io);

    // Error handler
    app.use(errorHandler);

    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('App failed to start', err);
    process.exit(1);
  }
};

startApp();
