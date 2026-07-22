const socketIO = require('socket.io');

const initSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join room for a specific order
    socket.on('joinOrderRoom', (orderId) => {
      console.log(`Socket ${socket.id} joined room: order_${orderId}`);
      socket.join(`order_${orderId}`);
    });

    // Leave room for a specific order
    socket.on('leaveOrderRoom', (orderId) => {
      console.log(`Socket ${socket.id} left room: order_${orderId}`);
      socket.leave(`order_${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initSocket;
