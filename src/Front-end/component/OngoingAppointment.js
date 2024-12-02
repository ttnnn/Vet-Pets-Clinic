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
  Typography,
} from '@mui/material';
import { styled } from '@mui/system';
import axios from 'axios';
import dayjs from 'dayjs';
import PostponeHotel from './PostponeHotel';
import 'dayjs/locale/th';  // นำเข้า locale ภาษาไทย
dayjs.locale('th'); // ตั้งค่าให้ dayjs ใช้ภาษาไทย


const categories = ['อาบน้ำ-ตัดขน', 'ตรวจรักษา', 'ฝากเลี้ยง', 'วัคซีน'];
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
const formatDate =(date)=>{
  return dayjs(date).format('YYYY-MM-DD');
}

const filterAppointments = (data, category) => {
  return data.filter(
    (item) =>
      item.type_service === category &&
      item.queue_status === 'กำลังให้บริการ' &&
      item.status === 'อนุมัติ'
  );
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

const OngoingAppointments = ({ appointments, onMoveToPending, onRevertToPending }) => {
  const [activeCategory, setActiveCategory] = useState('อาบน้ำ-ตัดขน');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('appointment_date');
  const [appointmentHotel, setAppointmentHotel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openPostponeDialog, setOpenPostponeDialog] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [selectedPetId, setSelectedPetId] = useState(null);


console.log('appointmentHotel',appointmentHotel)


  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/appointment/hotel`);
      setAppointmentHotel(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeCategory === 'ฝากเลี้ยง') {
      fetchAppointments();
    }
  }, [activeCategory]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedData = (data) =>
    data.sort(getComparator(order, orderBy));

  const filteredData =
    activeCategory === 'ฝากเลี้ยง'
      ? sortedData(filterAppointments(appointmentHotel, activeCategory))
      : sortedData(filterAppointments(appointments, activeCategory))
      ;

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeCategory}
          onChange={(e, newValue) => setActiveCategory(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          {categories.map((category) => (
            <StyledTab key={category} label={category} value={category} />
          ))}
        </Tabs>
      </Box>
      <TableContainer component={Paper}>
        {loading ? (
          <Typography align="center" sx={{ p: 3 }}>
            กำลังโหลดข้อมูล...
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                {activeCategory === 'ฝากเลี้ยง' ? (
                  <>
                    <TableCell>เลขที่นัดหมาย</TableCell>
                    <TableCell>หมายเลขกรง</TableCell>
                    <TableCell>ประเภท</TableCell>
                    <TableCell>ชื่อสัตว์</TableCell>
                    <TableCell>ชื่อเจ้าของ</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'entry_date'}
                        direction={orderBy === 'entry_date' ? order : 'asc'}
                        onClick={(event) => handleRequestSort(event, 'entry_date')}
                      >
                        วันเข้าพัก
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>วันที่กำหนดออก</TableCell>
                    <TableCell>สถานะ</TableCell>
                  </>
                ) : (
                  <>
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
                  </>
                )}
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((appointment) => {
                const today = dayjs(); // วันที่วันนี้
                const endDate = dayjs(appointment.end_date);
              
                const isPastEndDate =
                  activeCategory === 'ฝากเลี้ยง' && appointment.end_date && endDate.isBefore(today, 'day');
              
                const isEndDateToday =
                  activeCategory === 'ฝากเลี้ยง' && appointment.end_date && endDate.isSame(today, 'day');
              
                // กำหนดสีพื้นหลังตามเงื่อนไข
                const backgroundColor = isPastEndDate
                  ? '#fa1f14' // สีแดงอ่อนหากเกินกำหนด
                  : isEndDateToday
                  ? '#fa9993' // สีแดงอีกเฉดหากกำหนดออกเป็นวันนี้
                  : appointment.status_hotel === 'เข้าพัก'
                  ? '#fffacd' // สีเหลืองสำหรับสถานะ 'เข้าพัก'
                  : 'transparent'; // สีพื้นหลังโปร่งใสสำหรับสถานะอื่น ๆ
              
                return (
                  <TableRow key={appointment.appointment_id}>
                    <TableCell>
                      {appointment.appointment_id}
                    </TableCell>
                    {activeCategory === 'ฝากเลี้ยง' ? (
                      <>
                        <TableCell>{appointment.pet_cage_id || '-'}</TableCell>
                        <TableCell>{appointment.pet_species || '-'}</TableCell>
                        <TableCell>{appointment.pet_name}</TableCell>
                        <TableCell>{appointment.full_name}</TableCell>
                        <TableCell>
                          {appointment.start_date
                            ? formatDate(appointment.start_date)
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {appointment.end_date
                            ? formatDate(appointment.end_date)
                            : '-'}
                        </TableCell>
                        <TableCell>
                        <Box
                          sx={{
                            bgcolor: backgroundColor, // สีพื้นหลังตามเงื่อนไข
                            fontWeight: isPastEndDate || isEndDateToday ? 'bold' : 'normal', // เน้นข้อความถ้าเป็นเงื่อนไขสีแดง
                            width: '60%', // ขนาดของกล่องเป็น 60% ของช่อง
                            padding: '4px', 
                            borderRadius: '4px' 
                         }}>

                          {isPastEndDate
                            ? 'เกินกำหนด'
                            : isEndDateToday
                            ? 'กำหนดออกวันนี้'
                            : appointment.status_hotel || 'รอดำเนินการ'}
                        </Box>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          {appointment.appointment_time
                            ? formatTime(appointment.appointment_time)
                            : 'ตลอดทั้งวัน'}
                        </TableCell>
                        <TableCell>{appointment.pet_name}</TableCell>
                        <TableCell>{appointment.full_name}</TableCell>
                        <TableCell>{appointment.type_service}</TableCell>
                        <TableCell>{appointment.reason || '-'}</TableCell>
                      </>
                    )}
                    <TableCell>
                    <Box display="flex" gap={1}>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={async () => {
                          if (appointment.type_service === 'ฝากเลี้ยง') {
                            await onMoveToPending(appointment.appointment_id); // Action for "ปล่อยกลับ"
                            await fetchAppointments(); // อัปเดตข้อมูลใหม่
                          } else if (appointment.type_service === 'ตรวจรักษา') {
                            window.location.href = `/treatment/${appointment.appointment_id}`;
                          } else {
                            await onRevertToPending(appointment.appointment_id); // Action for other types
                          }
                        }}
                        
                      >
                        {appointment.type_service === 'ฝากเลี้ยง'
                          ? 'ปล่อยกลับ'
                          : appointment.type_service === 'ตรวจรักษา'
                          ? 'รักษา'
                          : 'คืนคิว'}
                      </Button>
                      {appointment.type_service !== 'ตรวจรักษา' && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            if (appointment.type_service === 'ฝากเลี้ยง') {
                              setSelectedAppointmentId(appointment.appointment_id);
                              setSelectedPetId(appointment.pet_id);
                              setOpenPostponeDialog(true);
                            } else {
                              onMoveToPending(appointment.appointment_id);
                            }
                          }}
                        >
                          {appointment.type_service === 'ฝากเลี้ยง' 
                          ? 'จองต่อ' 
                          : appointment.type_service === 'วัคซีน'
                          ? 'เลือกวัคซีน'
                          : 'ส่งคิว'}
                        </Button>
                      )}
                      <PostponeHotel
                        open={openPostponeDialog}
                        handleClose={() => setOpenPostponeDialog(false)}
                        appointmentId={selectedAppointmentId}
                        petId={selectedPetId}
                        updateAppointments={fetchAppointments}
                        isExtendBooking={true} 
                      />                    
                    </Box>
                  </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Paper>
  );
};

export default OngoingAppointments;
