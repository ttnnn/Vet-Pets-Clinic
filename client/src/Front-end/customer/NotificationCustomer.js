import React, { useState, useEffect, useRef } from 'react';
import { Snackbar, Alert } from '@mui/material';
import io from 'socket.io-client';

const NotificationCustomer = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'wss://two-vet-pets-clinic-00fe.onrender.com', {
      transports: ["websocket", "polling"],
      withCredentials: true
    });

    socket.emit('join-room', 'customer');
    // ฟังก์ชันเล่นเสียงแจ้งเตือน
    const playSound = (soundPath) => {
      const audio = new Audio(soundPath);
      audio.play().catch((err) => {
        console.error('Error playing sound:', err);
      });
    };

    socket.on('notification', (msg) => {
      if (msg && msg.message) {
        setMessage(msg.message);
        setOpen(true);
      }
      timeoutRef.current = setTimeout(() => {
        setMessage(msg.message);
        setOpen(true);
      }, 1000);

      playSound('/sounds/relax-message-tone.mp3'); // เล่นเสียงแจ้งเตือน
    });

    // Cleanup ตอน unmount
    return () => {
      socket.off('notification');
      socket.off('connect'); 
      socket.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Snackbar
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={9000}
      >
        <Alert
          onClose={handleClose}
          severity="info" // เปลี่ยนสีแจ้งเตือนให้เหมาะกับลูกค้า
          style={{
            fontSize: '16px',
            padding: '16px',
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default NotificationCustomer;
