import React, { useState , useEffect} from 'react';
import {  Typography, Box, Paper, Button, Tabs, Tab, Dialog, DialogActions, DialogContent, DialogTitle, TableCell, TableRow ,TableContainer,Table,TableBody,TableHead ,TableSortLabel} from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from './Sidebar'; // Assuming Sidebar is in the same directory
import axios from 'axios';
import dayjs from 'dayjs';
import AppointmentList from './component/AppointmentList';
// Categories for filtering
const categories = ['คิววันนี้', 'อาบน้ำ-ตัดขน', 'ตรวจรักษา', 'ฝากเลี้ยง', 'วัคซีน'];
const api = 'http://localhost:8080';

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
const formatTime = (timeString) => {
  // แยกเวลาออกจากรูปแบบ 'HH:mm:ss+ZZ' และแสดงแค่ 'HH:mm'
  const time = timeString.split(':');  // แยกเป็น [ '16', '00', '00+07' ]
  return `${time[0]}:${time[1]}`;  // คืนค่าแค่ '16:00'
};
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}
function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}
const formatDate = (date) => {
  const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear() + 543; // Adding 543 for Thai Buddhist year

  return `ตารางนัดหมายวันนี้ ${day} ${month} ${year}`;
};


const AppointmentSummary = ({ 
  totalAppointments, 
  ongoingAppointments, 
  pendingPayment, 
  tomorrowAppointments, 
  onClickSummary ,
  totalAppointmentsDay
}) => {
  const [activeTab, setActiveTab] = useState('total'); // เพิ่ม state สำหรับติดตาม Tab ที่กำลังกด

  const handleTabClick = (tabName) => {
    setActiveTab(tabName); // อัปเดต Tab ที่กำลังกด
    onClickSummary(tabName); // เรียกฟังก์ชันเดิม
  };

  return (
    <Box>
       <Typography variant="h6" sx={{ mb: 2, textAlign: 'left' }}>จำนวนการเข้าใช้บริการ {totalAppointmentsDay} คิว</Typography>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Paper 
          elevation={3} 
          sx={{ p: 2, width: '24%', textAlign: 'center', cursor: 'pointer' }} 
          onClick={() => handleTabClick('total')}
        >
          <Typography variant="h6">คิววันนี้</Typography>
          <Typography variant="h4">{totalAppointments}</Typography>
        </Paper>
        <Paper 
          elevation={3} 
          sx={{ p: 2, width: '24%', textAlign: 'center', backgroundColor: '#f0f4c3', cursor: 'pointer' }} 
          onClick={() => handleTabClick('ongoing')}
        >
          <Typography variant="h6">กำลังให้บริการ</Typography>
          <Typography variant="h4">{ongoingAppointments}</Typography>
        </Paper>
        <Paper 
          elevation={3} 
          sx={{ p: 2, width: '24%', textAlign: 'center', backgroundColor: '#f8d7da', cursor: 'pointer' }} 
          onClick={() => handleTabClick('pending-payment')}
        >
          <Typography variant="h6">กำลังชำระเงิน</Typography>
          <Typography variant="h4">{pendingPayment}</Typography>
        </Paper>
        <Paper 
          elevation={3} 
          sx={{ p: 2, width: '24%', textAlign: 'center', backgroundColor: '#c3eaf0', cursor: 'pointer' }} 
        >
          <Typography variant="h6">คิวพรุ่งนี้</Typography>
          <Typography variant="h4">{tomorrowAppointments}</Typography>
        </Paper>
      </Box>
      <Typography variant="h6" sx={{ mb: 2, textAlign: 'left' }}>
        {activeTab === 'total' && 'คิววันนี้'}
        {activeTab === 'ongoing' && 'กำลังให้บริการ'}
        {activeTab === 'pending-payment' && 'กำลังชำระเงิน'}
      </Typography>
    </Box>
  );
};

// AppointmentList componentll>


// OngoingAppointments component
const OngoingAppointments = ({ appointments, onMoveToPending, onRevertToPending }) => {
  const [activeCategory, setActiveCategory] = useState('คิววันนี้');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('appointment_date');

  const handleRequestSort = (event, property) => {
  const isAsc = orderBy === property && order === 'asc';
  setOrder(isAsc ? 'desc' : 'asc');
  setOrderBy(property);
};

  const filteredAppointments = appointments.filter(appointment => {
    if (activeCategory === 'คิววันนี้') {
      return appointment.queue_status === 'กำลังให้บริการ';
    }
    return appointment.category === activeCategory && appointment.queue_status === 'กำลังให้บริการ';
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
      <TableContainer component={Paper}>
   <Table>
     <TableHead>
       <TableRow>
         <TableCell>เลขที่นัดหมาย</TableCell>
         <TableCell>
           <TableSortLabel
             active={orderBy === 'appointment_time'}
             direction={orderBy === 'appointment_time' ? order : 'asc'}
             onClick={(event) => handleRequestSort(event, 'appointment_time')}
           >
             เวลา
           </TableSortLabel>
         </TableCell>
         <TableCell>ชื่อสัตว์</TableCell>
         <TableCell>ชื่อเจ้าของ</TableCell>
         <TableCell>ประเภทนัดหมาย</TableCell>
         <TableCell>รายละเอียด</TableCell>
         <TableCell sx={{width: '20%'}}></TableCell>
         <TableCell></TableCell>
       </TableRow>
     </TableHead>
     <TableBody>
       {filteredAppointments.sort(getComparator(order, orderBy)).map((appointment) => {
         // กำหนดสีตามประเภทการจองใน detail_server
         const detailColor = appointment.detail_service === 'นัดหมาย' ? '#eefaaa' : 
                             appointment.detail_service === 'walkin' ? '#aafabb' : '#cffdff';
         return (
           <TableRow key={appointment.appointment_id}> 
             <TableCell>{appointment.appointment_id}</TableCell>
             <TableCell>{appointment.appointment_time ? formatTime(appointment.appointment_time) : 'ตลอดทั้งวัน'}</TableCell>
             <TableCell>{appointment.pet_name}</TableCell>
             <TableCell>{appointment.full_name}</TableCell>
             <TableCell>{appointment.type_service}</TableCell>
             <TableCell>{appointment.reason || '-'}</TableCell>
             <TableCell>
               {/* ใช้ Box สำหรับกล่องสีพื้นหลังที่ไม่เต็มช่อง */}
               <Box 
                 sx={{ 
                   backgroundColor: detailColor, 
                   width: '60%', // ขนาดของกล่องเป็น 60% ของช่อง
                   padding: '4px', 
                   borderRadius: '4px' 
                 }}
               >
                 {appointment.detail_service || '-'}
               </Box>
             </TableCell>
             <TableCell>
               <Box mt={1} display="flex" justifyContent="flex-end">
                 <Button
                   variant="contained"
                   color="secondary"
                   sx={{ mr: 1 }}
                   onClick={() => onRevertToPending(appointment.appointment_id)}
                 >
                   คืนคิว
                 </Button>
                 <Button
                   variant="contained"
                   color="primary"
                   onClick={() => onMoveToPending(appointment.appointment_id)}
                 >
                   ส่งคิว
                 </Button>
               </Box>
             </TableCell>
           </TableRow>
         );
       })}
     </TableBody>
   </Table>
 </TableContainer>

    </Paper>
  );
};


// PendingAppointments component
const PendingAppointments = ({ appointments, onCancelAppointment }) => {
  const [activeCategory, setActiveCategory] = useState('คิววันนี้');
  const [openPopup, setOpenPopup] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('appointment_date');

  const handleRequestSort = (event, property) => {
  const isAsc = orderBy === property && order === 'asc';
  setOrder(isAsc ? 'desc' : 'asc');
  setOrderBy(property);
};


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
    if (activeCategory === 'คิววันนี้') {
      return appointment.queue_status === 'รอชำระเงิน';
    }
    return appointment.category === activeCategory && appointment.queue_status === 'รอชำระเงิน';
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
      <TableContainer component={Paper}>
   <Table>
     <TableHead>
       <TableRow>
         <TableCell>เลขที่นัดหมาย</TableCell>
         <TableCell>
           <TableSortLabel
             active={orderBy === 'appointment_time'}
             direction={orderBy === 'appointment_time' ? order : 'asc'}
             onClick={(event) => handleRequestSort(event, 'appointment_time')}
           >
             เวลา
           </TableSortLabel>
         </TableCell>
         <TableCell>ชื่อสัตว์</TableCell>
         <TableCell>ชื่อเจ้าของ</TableCell>
         <TableCell>ประเภทนัดหมาย</TableCell>
         <TableCell>รายละเอียด</TableCell>
         <TableCell sx={{width: '20%'}}></TableCell>
         <TableCell></TableCell>
       </TableRow>
     </TableHead>
     <TableBody>
       {filteredAppointments.sort(getComparator(order, orderBy)).map((appointment) => {
         // กำหนดสีตามประเภทการจองใน detail_server
         const detailColor = appointment.detail_service === 'นัดหมาย' ? '#eefaaa' : 
                             appointment.detail_service === 'walkin' ? '#aafabb' : '#cffdff';
         return (
           <TableRow key={appointment.appointment_id}> 
             <TableCell>{appointment.appointment_id}</TableCell>
             <TableCell>{appointment.appointment_time ? formatTime(appointment.appointment_time) : 'ตลอดทั้งวัน'}</TableCell>
             <TableCell>{appointment.pet_name}</TableCell>
             <TableCell>{appointment.full_name}</TableCell>
             <TableCell>{appointment.type_service}</TableCell>
             <TableCell>{appointment.reason || '-'}</TableCell>
             <TableCell>
               {/* ใช้ Box สำหรับกล่องสีพื้นหลังที่ไม่เต็มช่อง */}
               <Box 
                 sx={{ 
                   backgroundColor: detailColor, 
                   width: '60%', // ขนาดของกล่องเป็น 60% ของช่อง
                   padding: '4px', 
                   borderRadius: '4px' 
                 }}
               >
                 {appointment.detail_service || '-'}
               </Box>
             </TableCell>
             <TableCell>
               <Box mt={1} display="flex" justifyContent="flex-end">
                 <Button
                   variant="contained"
                   color="secondary"
                   sx={{ mr: 1 }}
                   onClick={() => onCancelAppointment(appointment.appointment_id)}
                 >
                   ยกเลิก
                 </Button>
                 <Button
                   variant="contained"
                   color="primary"
                   onClick={() => handleClickOpen(appointment.appointment_id)}
                 >
                   ชำระเงิน
                 </Button>
               </Box>
             </TableCell>
           </TableRow>
         );
       })}
     </TableBody>
   </Table>
 </TableContainer>


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
  const [appointments, setAppointments] = useState([]);
  const [view, setView] = useState('total');
 

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${api}/appointment`);
      setAppointments(response.data);
      console.log('Fetched appointments:', response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const updateAppointmentStatus = async (appointment_id, statusUpdates) => {
    try {
      await axios.put(`${api}/appointment/${appointment_id}`, statusUpdates);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const today = dayjs().format('YYYY-MM-DD');
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const totalAppointmentsDay = appointments.filter(
    (a) =>  dayjs(a.appointment_date).isSame(today, 'day') && a.status === 'อนุมัติ'
  ).length;

  const totalAppointments = appointments.filter(
    (a) => a.queue_status === 'รอรับบริการ' && dayjs(a.appointment_date).isSame(today, 'day') && a.status === 'อนุมัติ'
  ).length;

  const ongoingAppointments = appointments.filter(
    (a) => a.queue_status === 'กำลังให้บริการ' && dayjs(a.appointment_date).isSame(today, 'day') && a.status === 'อนุมัติ'
  ).length;

  const pendingPayment = appointments.filter(
    (a) => a.queue_status === 'รอชำระเงิน' && dayjs(a.appointment_date).isSame(today, 'day') && a.status === 'อนุมัติ'
  ).length;

  const tomorrowAppointments = appointments.filter((a) =>
    dayjs(a.appointment_date).isSame(tomorrow, 'day') && a.status === 'อนุมัติ'
  ).length;

  const handleNavigation = (summaryType) => {
    setView(summaryType);
  };

  const filteredAppointments = (status) =>
    appointments.filter(
      (a) => a.queue_status === status && dayjs(a.appointment_date).isSame(today, 'day')
    );

  const currentDate = new Date();
  const formattedDate = formatDate(currentDate);

  return (
    <Box display="flex" height="100vh">
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" align="left" gutterBottom>
          {formattedDate}
        </Typography>
        <AppointmentSummary
          totalAppointments={totalAppointments}
          ongoingAppointments={ongoingAppointments}
          pendingPayment={pendingPayment}
          tomorrowAppointments={tomorrowAppointments}
          onClickSummary={handleNavigation}
          totalAppointmentsDay= {totalAppointmentsDay}
        />
        {view === 'total' && (
          <AppointmentList
            appointments={filteredAppointments('รอรับบริการ')}
            onMoveToOngoing={(appointment_id) => updateAppointmentStatus(appointment_id, { queue_status: 'กำลังให้บริการ' })}
            onCancelAppointment={(appointment_id) =>
              updateAppointmentStatus(appointment_id, { status: 'ยกเลิกนัด', queue_status: 'ยกเลิกนัด' })
            }
          />
        )}
        {view === 'ongoing' && (
          <OngoingAppointments
            appointments={filteredAppointments('กำลังให้บริการ')}
            onMoveToPending={(appointment_id) =>
              updateAppointmentStatus(appointment_id, { queue_status: 'รอชำระเงิน' })
            }
            onRevertToPending={(appointment_id) =>
              updateAppointmentStatus(appointment_id, { queue_status: 'รอรับบริการ' })
            }
          />
        )}
        {view === 'pending-payment' && (
          <PendingAppointments
            appointments={filteredAppointments('รอชำระเงิน')}
            onMoveToOngoing={(appointment_id) =>
              updateAppointmentStatus(appointment_id, { queue_status: 'กำลังให้บริการ' })
            }
            onCancelAppointment={(appointment_id) =>
              updateAppointmentStatus(appointment_id, { status: 'ยกเลิกนัด', queue_status: 'ยกเลิกนัด' })
            }
          />
        )}
      </Box>
    </Box>
  );
};

export default HomeDashboard;
