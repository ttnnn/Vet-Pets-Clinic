const socketIo = require('socket.io');

const setupSocketServer = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: ["http://localhost:3000"],
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // รับข้อมูลว่าเป็นคลินิกหรือลูกค้า
    socket.on('join-room', (room) => {
      if (room === 'clinic') {
        socket.join('clinic');
        console.log(`Socket ${socket.id} joined clinic room`);
      } else if (room === 'customer') {
        socket.join('customer');
        console.log(`Socket ${socket.id} joined customer room`);
      }
    });

    // ตัวอย่าง: ส่งข้อความแจ้งเตือนไปยังคลินิก
    socket.on('send-to-clinic', (data) => {
      io.to('clinic').emit('notification', data);
      console.log('Notification sent to clinic:', data);
    });

    // ตัวอย่าง: ส่งข้อความแจ้งเตือนไปยังลูกค้า
    socket.on('send-to-customer', (data) => {
      io.to('customer').emit('notification', data);
      console.log('Notification sent to customer:', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = setupSocketServer;
