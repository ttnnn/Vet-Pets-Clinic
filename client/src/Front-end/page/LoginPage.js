import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Paper, Grid, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const api = 'http://localhost:8080/api/clinic';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error'); // error, success, info, warning
  const navigate = useNavigate();
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleLogin = async () => {
    setUsernameError(false);
    setPasswordError(false);

    // Validate inputs
    if (!username || !password) {
      if (!username) setUsernameError(true);
      if (!password) setPasswordError(true);
      return;
    }

    try {
      const response = await axios.post(`${api}/login`, { username, password });

      if (response.data.success) {
        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('isAuthenticated', 'true');
        onLogin(response.data.token);
        setSnackbarMessage('เข้าสู่ระบบสำเร็จ!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
        navigate('/clinic/home');
      } else {
        setSnackbarMessage('ชื่อหรือรหัสผ่านไม่ถูกต้อง');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Login failed:', error);
      setSnackbarMessage('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      width="100vw"
      bgcolor="#f5f5f5"
    >
      <Paper
        elevation={3}
        sx={{
          padding: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 0,
        }}
      >
        <Grid container spacing={0} sx={{ height: '100%' }}>
          <Grid item xs={12} md={6} sx={{ height: '100%' }}>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
              overflow="hidden"
            >
              <img
                src="/login.jpg"
                alt="Animal"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6} sx={{ height: '100%' }}>
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              height="100%"
              padding={4}
            >
              <img
                src="/Logo.jpg"
                alt="Logo"
                style={{ width: '150px', marginBottom: '20px' }}
              />
              <Typography variant="h5" gutterBottom>
                เข้าสู่ระบบ
              </Typography>
              <Box sx={{ width: '75%', maxWidth: '400px' }}>
                <TextField
                  label="username"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  helperText={usernameError ? 'กรุณากรอกชื่อผู้ใช้งาน' : ''}
                  error={usernameError}
                  sx={{ marginBottom: 2 }}
                />
                <TextField
                  label="password"
                  variant="outlined"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={passwordError}
                  helperText={passwordError ? 'กรุณากรอกรหัสผ่าน' : ''}
                  sx={{ marginBottom: 2 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleLogin}
                  sx={{ marginTop: 2 }}
                >
                  เข้าสู่ระบบ
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginPage;
