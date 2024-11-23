import React, { useState } from 'react';
import {  Box, Paper, Button, Tabs, Tab, Dialog, DialogActions, DialogContent, DialogTitle, TableCell,
     TableRow ,TableContainer,Table,TableBody,TableHead ,TableSortLabel,Typography, IconButton} from '@mui/material';
import { styled } from '@mui/system';
import CloseIcon from '@mui/icons-material/Close';
// Categories for filtering
const categories = ['คิววันนี้', 'อาบน้ำ-ตัดขน', 'ตรวจรักษา', 'ฝากเลี้ยง', 'วัคซีน'];
// const api = 'http://localhost:8080';

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

const AppointmentList = ({ appointments, onMoveToOngoing, onCancelAppointment }) => {
    const [activeCategory, setActiveCategory] = useState('คิววันนี้');
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('appointment_date');
    const [openPopup, setOpenPopup] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
  
    const handleRequestSort = (event, property) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
    };
  
    const filteredAppointments = appointments.filter(appointment => {
      if (activeCategory === 'คิววันนี้') {
        return appointment.queue_status === 'รอรับบริการ';
      }
      return appointment.type_service === activeCategory && appointment.queue_status === 'รอรับบริการ';
    });
    const handleClickOpen = (appointment) => {
        setSelectedAppointment(appointment);
        setOpenPopup(true);
      };
      const handleClose = () => {
        setOpenPopup(false);
        setSelectedAppointment(null);
      };
  
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
                        //   onClick={() => onMoveToOngoing(appointment.appointment_id)}
                        onClick={() => handleClickOpen(appointment)}
                        >
                          ประวัติ
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Dialog open={openPopup} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          ซักประวัติ
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
        <DialogContent>
          {selectedAppointment && (
            <Box>
              <Typography variant="h6">{selectedAppointment.pet_name}</Typography>
              <Typography>เจ้าของ: {selectedAppointment.full_name}</Typography>
              <Typography>น้ำหนัก: {selectedAppointment.weight} Kg</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="primary" 
           onClick={() => {
            onMoveToOngoing(selectedAppointment?.appointment_id); // เรียกฟังก์ชันส่งคิว
            handleClose(); // ปิดฟอร์มหลังจากส่งคิว
          }}>
              ส่งคิว
          </Button>
        </DialogActions>
      </Dialog>
      </Paper>
      
    );
  };

export default AppointmentList