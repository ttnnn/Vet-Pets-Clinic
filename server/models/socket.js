// socket.js
const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
  io = socketIo(server); // สร้าง instance ของ socket.io
};

const emitNewAppointment = (pet_id, newAppointmentID) => {
  if (io) {
    io.to('clinic').emit('new-appointment', {
      message: `มีนัดหมายใหม่ รออนุมัติสำหรับสัตว์เลี้ยง ID: ${pet_id}`,
      appointmentID: newAppointmentID,
    });
  } else {
    console.error('Socket.io is not initialized');
  }
};

module.exports = { initSocket, emitNewAppointment };
