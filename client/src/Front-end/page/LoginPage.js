import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Paper, Grid, Snackbar, Alert, CircularProgress, Link, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { clinicAPI } from "../../utils/api";

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleLogin = async () => {
    setUsernameError(false);
    setPasswordError(false);

    if (!username || !password) {
      if (!username) setUsernameError(true);
      if (!password) setPasswordError(true);
      return;
    }

    setLoading(true);
    try {
      const response = await clinicAPI.post(`/login`, { username, password });

      if (response.data.success) {
        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('username', username);
        onLogin(response.data.token);
        navigate('/clinic/home');
      } else {
        setSnackbarMessage('username หรือ password ไม่ถูกต้อง');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage('username หรือ password ไม่ถูกต้อง');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail || !forgotUsername) {
      setSnackbarMessage('กรุณากรอกอีเมลและ username');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    try {
      setForgotLoading(true);
      const response = await clinicAPI.post('/auth/forgot-password', { email: forgotEmail, username: forgotUsername });
      
      if (response.data.success) {
        setSnackbarMessage('กรุณาตรวจสอบอีเมลของคุณเพื่อรีเซ็ตรหัสผ่าน');
        setSnackbarSeverity('success');
        setForgotDialogOpen(false);
      } else {
        setSnackbarMessage('ไม่พบข้อมูลในระบบ');
        setSnackbarSeverity('error');
      }
    } catch (error) {
      setSnackbarMessage('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      setSnackbarSeverity('error');
    }
    setSnackbarOpen(true);
    setForgotLoading(false);
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh" width="100vw" bgcolor="#f5f5f5">
      <Paper
        elevation={3}
        sx={{ padding: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 0 }}
      >
        <Grid container spacing={0} sx={{ height: '100%' }}>
          <Grid item xs={12} md={6} sx={{ height: '100%' }}>
            <Box display="flex" justifyContent="center" alignItems="center" height="100%" overflow="hidden">
              <img src="/login.jpg" alt="Animal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
          </Grid>

          <Grid item xs={12} md={6} sx={{ height: '100%' }}>
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%" padding={4}>
              <img src="/Logo.jpg" alt="Logo" style={{ width: '150px', marginBottom: '20px' }} />
              <Typography variant="h5" gutterBottom>เข้าสู่ระบบ</Typography>
              <Box sx={{ width: '75%', maxWidth: '400px' }}>
                <TextField
                  label="username"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  error={usernameError}
                  helperText={usernameError ? 'กรุณากรอกชื่อผู้ใช้งาน' : ''}
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
                <Link
                  component="button"
                  variant="body2"
                  sx={{ display: 'block', color: 'blue', cursor: 'pointer', textAlign: 'right', marginBottom: 2 }}
                  onClick={() => setForgotDialogOpen(true)}
                >
                  ลืมรหัสผ่าน?
                </Link>
                <Button variant="contained" color="primary" fullWidth onClick={handleLogin} sx={{ marginTop: 2 }} disabled={loading}>
                  {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'เข้าสู่ระบบ'}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Popup กรอกข้อมูลลืมรหัสผ่าน */}
      <Dialog open={forgotDialogOpen} onClose={() => setForgotDialogOpen(false)}>
        <DialogTitle>ลืมรหัสผ่าน</DialogTitle>
        <DialogContent>
          <TextField
            label="username"
            variant="outlined"
            fullWidth
            margin="normal"
            value={forgotUsername}
            onChange={(e) => setForgotUsername(e.target.value)}
          />
          <TextField
            label="อีเมล"
            variant="outlined"
            fullWidth
            margin="normal"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForgotDialogOpen(false)}>ยกเลิก</Button>
          <Button onClick={handleForgotPassword} color="primary" variant="contained" disabled={forgotLoading}>
            {forgotLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'ส่งคำขอ'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginPage;
