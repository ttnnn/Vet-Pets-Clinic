import React from 'react';
import {  useNavigate } from 'react-router-dom';
import { Container, Typography, Button } from '@mui/material';

const AppointmentDetail = () => {
  // const { id } = useParams();
  const Navigate = useNavigate
  // Mock data for demonstration
  const appointment = {
    id: 1,
    type: 'Cat',
    date: '16 June',
    time: '8:30 AM',
    status: 'Confirmed',
    description: 'Regular check-up.',
  };

  const handleCancel = () => {
    // Handle cancel logic
    Navigate('/home');
  };

  const handlePostpone = () => {
    // Handle postpone logic
    Navigate('/home');
  };

  return (
    <Container>
      <Typography variant="h4">Appointment Details</Typography>
      <Typography variant="h6">Type: {appointment.type}</Typography>
      <Typography>Date: {appointment.date}</Typography>
      <Typography>Time: {appointment.time}</Typography>
      <Typography>Status: {appointment.status}</Typography>
      <Typography>Description: {appointment.description}</Typography>
      <Button variant="contained" color="secondary" onClick={handleCancel}>
        Cancel
      </Button>
      <Button variant="contained" color="primary" onClick={handlePostpone} style={{ marginLeft: 10 }}>
        Postpone
      </Button>
    </Container>
  );
};

export default AppointmentDetail;
