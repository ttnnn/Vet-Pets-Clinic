const socketIo = require('socket.io');
const pool = require('../db.js');

const setupSocketServer = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: ["https://two-vet-pets-clinic.onrender.com"],
      methods: ["GET", "POST"]
    }
  });

    // เชื่อมต่อกับ PostgreSQL และฟังการแจ้งเตือนจากฐานข้อมูล
    pool.connect((err, client) => {
      if (err) {
        console.error('Error connecting to database:', err);
        return;
      }
      console.log('Listening for new_appointment notifications...');
      
      client.query('LISTEN new_appointment'); // ฟังการแจ้งเตือนจาก PostgreSQL
    
      client.on('notification', (msg) => {
        console.log('Received notification:', msg);
        
        // Parsing payload ของ notification (ในกรณีที่ PostgreSQL ส่ง payload มา)
        const payload = JSON.parse(msg.payload); // ต้องแน่ใจว่า PostgreSQL ส่ง payload ในรูปแบบ JSON
    
        if (msg.channel === 'new_appointment' && payload.status === 'รออนุมัติ') {
          // ส่งการแจ้งเตือนถึงผู้ใช้ที่อยู่ในห้อง 'clinic'
          io.to('clinic').emit('notification', { message: 'มีนัดหมายใหม่ รอการอนุมัติ' });
        }
      });
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

    // ส่งข้อความแจ้งเตือนไปยังคลินิก
    socket.on('send-to-clinic', (data) => {
      io.to('clinic').emit('notification', data); // ส่งไปยังห้อง clinic
      console.log('Notification sent to clinic:', data);
    });

    socket.on('broadcast-message', (data) => {
      io.emit('notification', data); // ส่งไปยังทุกคน
      console.log('Broadcast message sent:', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = setupSocketServer;
