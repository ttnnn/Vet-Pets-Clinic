import React, { useState } from 'react';
import { Box, Typography, Snackbar, AppBar, Toolbar, IconButton } from '@mui/material';
// import axios from 'axios';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Alert from '@mui/material/Alert';
import CheckIcon from '@mui/icons-material/Check';
import { useLocation, useNavigate } from 'react-router-dom';
// import dayjs from 'dayjs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddAppointment from '../component/CreateAppointment';

// const api = 'http://localhost:8080/api/customer';

const ServiceAppointment = () => {
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const navigate = useNavigate();
  const location = useLocation();
  const { owner_id } = location.state || {};
  
  // console.log('location.state',location.state )
  // console.log('owner_id', owner_id);
  const user = JSON.parse(sessionStorage.getItem('user')); 
  // console.log('user',user)
  const handleBackToHome = () => {
    navigate('/customer/home');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', mt: 3 }}>
        <AppBar position="fixed">
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={handleBackToHome}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 , textAlign: 'center'}}>
              จองคิวเข้าใช้บริการ
            </Typography>
          </Toolbar>
        </AppBar>
  
        {alertMessage && (
          <Alert severity={alertSeverity} icon={alertSeverity === 'success' ? <CheckIcon fontSize="inherit" /> : undefined}>
            {alertMessage}
          </Alert>
        )}
        <Snackbar open={!!alertMessage} autoHideDuration={6000} onClose={() => setAlertMessage('')}>
          <Alert onClose={() => setAlertMessage('')} severity={alertSeverity}>
            {alertMessage}
          </Alert>
        </Snackbar>
          <AddAppointment
            isCustomerAppointment = {true}
            ownerID = {owner_id}
          />
           
      </Box>
    </LocalizationProvider>
  );
};

export default ServiceAppointment;
