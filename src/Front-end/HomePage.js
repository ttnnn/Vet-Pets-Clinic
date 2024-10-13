import React, { useState } from 'react';
import { Container, Typography, Box, Paper, Button, Tabs, Tab, Grid, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from './Sidebar'; // Assuming Sidebar is in the same directory

// Initial data for appointments
const initialAppointments = [
  { id: 1, name: 'คอลลิน', service: 'อาบน้ำ-ตัดขน', time: '09:30 นาฬิกา', category: 'อาบน้ำ-ตัดขน', status: 'pending' },
  { id: 2, name: 'ลูฟี่', service: 'ตรวจรักษา', time: '09:30 นาฬิกา', category: 'ตรวจรักษา', status: 'pending' },
  { id: 3, name: 'ข้าวเหนียว', service: 'ฝากเลี้ยง', time: '09:30 นาฬิกา', category: 'ฝากเลี้ยง', status: 'pending' },
  { id: 4, name: 'เต้าหู้', service: 'วัคซีน', time: '09:30 นาฬิกา', category: 'วัคซีน', status: 'pending' }
];

// Categories for filtering
const categories = ['ทั้งหมด', 'อาบน้ำ-ตัดขน', 'ตรวจรักษา', 'ฝากเลี้ยง', 'วัคซีน'];

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  minWidth: 0,
  marginRight: theme.spacing(2),
  fontWeight: theme.typography.fontWeightRegular,
  '&:hover': {
    color: '#40a9ff',
    opacity: 1,
  },
  '&.Mui-selected': {
    color: 'black',
    fontWeight: theme.typography.fontWeightMedium,
  },
  '&.Mui-focusVisible': {
    backgroundColor: 'rgba(100, 95, 228, 0.32)',
  },
}));

const formatDate = (date) => {
  const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear() + 543; // Adding 543 for Thai Buddhist year

  return `ตารางนัดหมายวันนี้ ${day} ${month} ${year}`;
};

// AppointmentSummary component
const AppointmentSummary = ({ 
  totalAppointments, 
  ongoingAppointments, 
  pendingPayment, 
  tomorrowAppointments,
  onClickSummary
}) => (
  <Box display="flex" justifyContent="space-between" mb={3}>
    <Paper 
      elevation={3} 
      sx={{ p: 2, width: '24%', textAlign: 'center', cursor: 'pointer' }} 
      onClick={() => onClickSummary('total')}
    >
      <Typography variant="h6">คิวทั้งหมด</Typography>
      <Typography variant="h4">{totalAppointments}</Typography>
    </Paper>
    <Paper 
      elevation={3} 
      sx={{ p: 2, width: '24%', textAlign: 'center', backgroundColor: '#f0f4c3', cursor: 'pointer' }} 
      onClick={() => onClickSummary('ongoing')}
    >
      <Typography variant="h6">กำลังให้บริการ</Typography>
      <Typography variant="h4">{ongoingAppointments}</Typography>
    </Paper>
    <Paper 
      elevation={3} 
      sx={{ p: 2, width: '24%', textAlign: 'center', backgroundColor: '#f8d7da', cursor: 'pointer' }} 
      onClick={() => onClickSummary('pending-payment')}
    >
      <Typography variant="h6">กำลังชำระเงิน</Typography>
      <Typography variant="h4">{pendingPayment}</Typography>
    </Paper>
    <Paper 
      elevation={3} 
      sx={{ p: 2, width: '24%', textAlign: 'center', backgroundColor: '#c3eaf0', cursor: 'pointer' }} 
      onClick={() => onClickSummary('tomorrow')}
    >
      <Typography variant="h6">คิวพรุ่งนี้</Typography>
      <Typography variant="h4">{tomorrowAppointments}</Typography>
    </Paper>
  </Box>
);

// AppointmentList component
const AppointmentList = ({ appointments, onMoveToOngoing, onCancelAppointment }) => {
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');

  const filteredAppointments = appointments.filter(appointment => {
    if (activeCategory === 'ทั้งหมด') {
      return appointment.status === 'pending';
    }
    return appointment.category === activeCategory && appointment.status === 'pending';
  });

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeCategory}
          onChange={(e, newValue) => setActiveCategory(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="scrollable auto tabs example"
        >
          {categories.map(category => (
            <StyledTab
              key={category}
              label={category}
              value={category}
            />
          ))}
        </Tabs>
      </Box>
      
      <Box sx={{ mt: 2 }}>
        {filteredAppointments.map((appointment, index) => (
          <Paper key={appointment.id} elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">{appointment.name}</Typography>
            <Typography>เวลานัดหมาย : {appointment.time}</Typography>
            <Box mt={1} display="flex" justifyContent="flex-end">
              <Button 
                variant="contained" 
                color="secondary" 
                sx={{ mr: 1 }}
                onClick={() => onCancelAppointment(appointment.id)}
              >
                ยกเลิก
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => onMoveToOngoing(appointment.id)}
              >
                ส่งคิว
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>
    </Paper>
  );
};

// OngoingAppointments component
const OngoingAppointments = ({ appointments, onMoveToPending, onRevertToPending }) => {
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');

  const filteredAppointments = appointments.filter(appointment => {
    if (activeCategory === 'ทั้งหมด') {
      return appointment.status === 'ongoing';
    }
    return appointment.category === activeCategory && appointment.status === 'ongoing';
  });

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeCategory}
          onChange={(e, newValue) => setActiveCategory(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="scrollable auto tabs example"
        >
          {categories.map(category => (
            <StyledTab
              key={category}
              label={category}
              value={category}
            />
          ))}
        </Tabs>
      </Box>
      
      <Box sx={{ mt: 2 }}>
        {filteredAppointments.map((appointment, index) => (
          <Paper key={appointment.id} elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">{appointment.name}</Typography>
            <Typography>บริการ: {appointment.service}</Typography>
            <Typography>เวลานัดหมาย : {appointment.time}</Typography>
            <Box mt={1} display="flex" justifyContent="flex-end">
              <Button 
                variant="contained" 
                color="secondary" 
                sx={{ mr: 1 }}
                onClick={() => onRevertToPending(appointment.id)}
              >
                คืนคิว
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => onMoveToPending(appointment.id)}
              >
                ส่งคิว
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>
    </Paper>
  );
};

// PendingAppointments component
const PendingAppointments = ({ appointments, onMoveToOngoing, onCancelAppointment }) => {
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');
  const [openPopup, setOpenPopup] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const handleClickOpen = (appointment) => {
    setSelectedAppointment(appointment);
    setOpenPopup(true);
  };

  const handleClose = () => {
    setOpenPopup(false);
    setSelectedAppointment(null);
  };

  const handlePay = () => {
    // Logic to handle payment
    handleClose(); // Close popup after payment action
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (activeCategory === 'ทั้งหมด') {
      return appointment.status === 'pending-payment';
    }
    return appointment.category === activeCategory && appointment.status === 'pending-payment';
  });

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeCategory}
          onChange={(e, newValue) => setActiveCategory(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="scrollable auto tabs example"
        >
          {categories.map(category => (
            <StyledTab
              key={category}
              label={category}
              value={category}
            />
          ))}
        </Tabs>
      </Box>
      
      <Box sx={{ mt: 2 }}>
        {filteredAppointments.map((appointment) => (
          <Paper key={appointment.id} elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">{appointment.name}</Typography>
            <Typography>บริการ: {appointment.service}</Typography>
            <Typography>เวลานัดหมาย: {appointment.time}</Typography>
            <Box mt={1} display="flex" justifyContent="flex-end">
              <Button 
                variant="contained" 
                color="secondary" 
                sx={{ mr: 1 }}
                onClick={() => onCancelAppointment(appointment.id)}
              >
                ยกเลิก
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => handleClickOpen(appointment)}
              >
                ชำระเงิน
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Popup for payment */}
      <Dialog open={openPopup} onClose={handleClose} maxWidth="md" fullWidth>
  <DialogTitle>
    ชำระเงิน
  </DialogTitle>
  <DialogContent>
    {selectedAppointment && (
      <Box display="flex" flexDirection="row" justifyContent="space-between" mb={2}>
        {/* Left Section: Search bar and Dropdown */}
        <Box flex="1" pr={2}>
          {/* Search Bar and Dropdown */}
          <Box mt={2}>
            <input
              type="text"
              placeholder="ค้นหายา/บริการ"
              style={{
                padding: '8px',
                width: '100%',
                marginBottom: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <select
              style={{
                padding: '8px',
                width: '100%',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="medication1">ยา ABC</option>
              <option value="medication2">ยา XYZ</option>
              <option value="service1">บริการ 123</option>
              <option value="service2">บริการ 456</option>
            </select>
            <select
              style={{
                padding: '8px',
                width: '100%',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="medication1">รายการ1</option>
              <option value="medication2">รายการ2</option>
              <option value="service1">รายการ3</option>
              <option value="service2">รายการ4</option>
            </select>
          </Box>
        </Box>

        {/* Right Section: Customer and Pet Info and Payment Details */}
        <Box flex="1" pl={2}>
          {/* Customer and Pet Info */}
          <Box mb={2}>
            <Typography variant="body1" gutterBottom>
              ชื่อลูกค้า: {selectedAppointment.name}
            </Typography>
            <Typography variant="body2" gutterBottom>
              สัตว์เลี้ยง: {selectedAppointment.pet}
            </Typography>
            <Typography variant="body2" gutterBottom>
              หมายเลขออเดอร์: #{selectedAppointment.orderNumber}
            </Typography>
            <Typography variant="body2" gutterBottom>
              วันที่: {selectedAppointment.date}
            </Typography>
          </Box>

          {/* Payment Details */}
          <Typography variant="h6" gutterBottom>
            รายละเอียดการชำระเงิน
          </Typography>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2">ค่ารักษาพยาบาล</Typography>
            <Typography variant="body2">150 บาท</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2">อาบน้ำแมว &lt; 5kg</Typography>
            <Typography variant="body2">300 บาท</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mt={2}>
            <Typography variant="h6">รวม</Typography>
            <Typography variant="h6">450 บาท</Typography>
          </Box>
        </Box>
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose} variant="outlined">
      ยกเลิก
    </Button>
    <Button onClick={handlePay} variant="contained" color="primary">
      ชำระเงิน
    </Button>
  </DialogActions>
</Dialog>
      </Paper>
  );
};

// HomeDashboard component
const HomeDashboard = () => {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [view, setView] = useState('total');

  const handleMoveToOngoing = (id) => {
    const updatedAppointments = appointments.map(appointment =>
      appointment.id === id ? { ...appointment, status: 'ongoing' } : appointment
    );
    setAppointments(updatedAppointments);
  };

  const handleMoveToPending = (id) => {
    const updatedAppointments = appointments.map(appointment =>
      appointment.id === id ? { ...appointment, status: 'pending-payment' } : appointment
    );
    setAppointments(updatedAppointments);
  };

  const handleCancelAppointment = (id) => {
    const updatedAppointments = appointments.filter(appointment => appointment.id !== id);
    setAppointments(updatedAppointments);
  };

  const handleNavigation = (summaryType) => {
    setView(summaryType);
  };

  const handleRevertToPending = (id) => {
    const updatedAppointments = appointments.map(appointment =>
      appointment.id === id ? { ...appointment, status: 'pending' } : appointment
    );
    setAppointments(updatedAppointments);
  };

  const totalAppointments = appointments.filter(a => a.status === 'pending').length;
  const ongoingAppointments = appointments.filter(a => a.status === 'ongoing').length;
  const pendingPayment = appointments.filter(a => a.status === 'pending-payment').length;
  const tomorrowAppointments = 0; // Set this value based on your logic

  // Get current date for the title
  const currentDate = new Date();
  const formattedDate = formatDate(currentDate);

  return (

    <Box display="flex" height="100vh" >
      <Sidebar/>
      <Box sx={{ flexGrow: 1, p: 3 }}>
          <Typography variant="h4" align="left" gutterBottom>{formattedDate}</Typography>
          <AppointmentSummary 
            totalAppointments={totalAppointments} 
            ongoingAppointments={ongoingAppointments}
            pendingPayment={pendingPayment}
            tomorrowAppointments={tomorrowAppointments}
            onClickSummary={handleNavigation}
          />

          {view === 'total' && (
            <AppointmentList 
              appointments={appointments.filter(a => a.status === 'pending')}
              onMoveToOngoing={handleMoveToOngoing}
              onCancelAppointment={handleCancelAppointment} 
            />
          )}
          {view === 'ongoing' && (
            <OngoingAppointments 
              appointments={appointments.filter(a => a.status === 'ongoing')}
              onMoveToPending={handleMoveToPending}
              onRevertToPending={handleRevertToPending}
            />
          )}
          {view === 'pending-payment' && (
            <PendingAppointments 
              appointments={appointments.filter(a => a.status === 'pending-payment')}
              onMoveToOngoing={handleMoveToOngoing}
              onCancelAppointment={handleCancelAppointment}
            />
          )}
      </Box>
    </Box>
  );
};

export default HomeDashboard;
