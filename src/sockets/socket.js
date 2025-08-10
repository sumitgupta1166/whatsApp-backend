import { Server } from 'socket.io';

let ioInstance = null;

export function initSocket(serverOrIo) {
  if (ioInstance) return ioInstance;
  ioInstance = serverOrIo;
  try {
    ioInstance.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
      });
    });
  } catch (e) {
    // ignore during startup if not ready
  }
  return ioInstance;
}

export function getIO() {
  if (!ioInstance) throw new Error('Socket.io not initialized - call initSocket(io) first');
  return ioInstance;
}
