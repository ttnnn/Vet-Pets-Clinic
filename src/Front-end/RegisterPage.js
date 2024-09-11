import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Paper, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, ToggleButtonGroup, ToggleButton, MenuItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Sidebar from './Sidebar';
import './RegisterPage.css';

const RegisterPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [gender, setGender] = useState('male');
  const [imagePreview, setImagePreview] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState('');

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setImagePreview(null);  // Clear image preview when closing
  };

  const handleGenderChange = (event, newGender) => {
    if (newGender !== null) {
      setGender(newGender);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBirthDateChange = (event) => {
    const selectedDate = event.target.value;
    setBirthDate(selectedDate);
    calculateAge(selectedDate);
  };

  const calculateAge = (date) => {
    const today = new Date();
    const birthDate = new Date(date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    setAge(age);
  };

  const handleSearch = () => {
    // Implement search functionality here
    console.log('Searching for:', customerName, phoneNumber);
  };

  return (
    <Box className="main-container">
      <Sidebar />
      <Box className="register-container">
        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            centered={false}
            TabIndicatorProps={{
              style: {
                backgroundColor: 'black',
              },
            }}
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
            }}
          >
            <Tab label="ลงทะเบียนสัตว์เลี้ยงใหม่" className="tab-button" />
            <Tab label="ค้นหาข้อมูลลูกค้า" className="tab-button" />
          </Tabs>

          <Box p={3}>
            {activeTab === 0 ? (
              <Box>
                <Typography variant="h4" gutterBottom>
                  ลงทะเบียนสัตว์เลี้ยงใหม่
                </Typography>
                <Box component="form" noValidate autoComplete="off" className="register-form">
                  <Box className="form-row">
                    <TextField
                      label="ชื่อลูกค้า"
                      name="customerName"
                      variant="outlined"
                      fullWidth
                      sx={{ mr: 1 }}
                    />
                    <TextField
                      label="นามสกุล"
                      name="customerSurname"
                      variant="outlined"
                      fullWidth
                      sx={{ mr: 1 }}
                    />
                    <TextField
                      label="เบอร์โทรศัพท์"
                      name="phoneNumber"
                      variant="outlined"
                      fullWidth
                    />
                  </Box>
                  <Button 
                    variant="contained" 
                    onClick={handleClickOpen} 
                    className="submit-button"
                  >
                    ลงทะเบียนสัตว์เลี้ยงใหม่
                  </Button>
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    สัตว์เลี้ยงของคุณ
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography variant="h4" gutterBottom>
                  ค้นหาข้อมูลลูกค้า
                </Typography>
                <Box component="form" noValidate autoComplete="off" className="search-form">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                      label="ชื่อ"
                      name="searchCustomerName"
                      variant="outlined"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      fullWidth
                      sx={{ mr: 1 }}
                    />
                    <TextField
                      label="เบอร์โทรศัพท์"
                      name="searchPhoneNumber"
                      variant="outlined"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      fullWidth
                      sx={{ mr: 1 }}
                    />
                    <Button 
                      variant="contained" 
                      onClick={handleSearch} 
                      className="submit-button"
                    >
                      ค้นหา
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          เพิ่มประวัติสัตว์เลี้ยงใหม่
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box
            component="form"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <label htmlFor="image-upload">
                <Button
                  component="span"
                  variant="contained"
                  className="upload-button"  // ใช้ className เพื่อใช้สไตล์ที่กำหนดใน CSS
                >
                  {imagePreview ? (
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="Pet"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '4px',
                      }}
                    />
                  ) : (
                    <Typography className="upload-button-text">อัพโหลดรูปภาพ</Typography>
                  )}
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  hidden
                />
              </label>
            </Box>
            <Box sx={{ flex: 2 }}>
              <TextField
                label="ชื่อ"
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                select
                label="พันธุ์"
                fullWidth
                sx={{ mb: 2 }}
              >
                <MenuItem value="พันธุ์ที่ 1">พันธุ์ที่ 1</MenuItem>
                <MenuItem value="พันธุ์ที่ 2">พันธุ์ที่ 2</MenuItem>
                <MenuItem value="พันธุ์ที่ 3">พันธุ์ที่ 3</MenuItem>
              </TextField>
              <TextField
                label="วันเกิด"
                fullWidth
                type="date"
                InputLabelProps={{
                  shrink: true,
                }}
                value={birthDate}
                onChange={handleBirthDateChange}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <TextField label="อายุ" value={age} sx={{ width: '30%' }} InputProps={{ readOnly: true }} />
                <TextField label="ปี" value={Math.floor(age / 12)} sx={{ width: '30%' }} InputProps={{ readOnly: true }} />
                <TextField label="เดือน" value={age % 12} sx={{ width: '30%' }} InputProps={{ readOnly: true }} />
              </Box>
              <ToggleButtonGroup
                value={gender}
                exclusive
                onChange={handleGenderChange}
                fullWidth
                sx={{ mt: 2 }}
              >
                <ToggleButton value="male">
                  <Typography>♂</Typography>
                </ToggleButton>
                <ToggleButton value="female">
                  <Typography>♀</Typography>
                </ToggleButton>
              </ToggleButtonGroup>
              <TextField label="ประวัติการฉีดวัคซีน" multiline rows={4} fullWidth sx={{ mt: 2 }} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>ยกเลิก</Button>
          <Button 
            variant="contained" 
            onClick={() => console.log('Registering new pet')} 
            className="submit-button"
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RegisterPage;
