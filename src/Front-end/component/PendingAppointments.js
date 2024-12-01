import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Button,
  Tabs,
  Tab,
  TableCell,
  TableRow,
  TableContainer,
  Table,
  TableBody,
  TableHead,
  TableSortLabel,
  Typography, Dialog, DialogActions, DialogContent, DialogTitle,
} from '@mui/material';
import { styled } from '@mui/system';
import axios from 'axios';
import dayjs from 'dayjs';
import PostponeHotel from './PostponeHotel';
import 'dayjs/locale/th';  // นำเข้า locale ภาษาไทย
dayjs.locale('th'); // ตั้งค่าให้ dayjs ใช้ภาษาไทย
const categories = ['คิวทั้งหมด'];

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
}));

const formatTime = (timeString) => {
  const time = timeString.split(':');
  return `${time[0]}:${time[1]}`;
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

// PendingAppointments component
const PendingAppointments = ({ appointments }) => {
    const [activeCategory, setActiveCategory] = useState('คิวทั้งหมด');
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
      if (activeCategory === 'คิวทั้งหมด') {
        return appointment.queue_status === 'รอชำระเงิน' && appointment.status=== 'อนุมัติ';
      }
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
                               appointment.detail_service === 'Walk-in' ? '#aafabb' : '#cffdff';
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
  

export default PendingAppointments