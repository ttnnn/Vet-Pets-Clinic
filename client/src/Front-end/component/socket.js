// src/socket.js
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'wss://two-vet-pets-clinic-00fe.onrender.com', {
  transports: ["websocket", "polling"],
  withCredentials: true
});

export default socket;
