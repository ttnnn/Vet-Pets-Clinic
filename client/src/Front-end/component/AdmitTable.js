import React, { useState , useEffect } from 'react';
import {  Box, Paper, Button,  TableCell,
     TableRow ,TableContainer,Table,TableBody,TableHead ,TableSortLabel,Typography} from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/th'; // Thai localization
import axios from 'axios';


// Categories for filtering
const api = 'http://localhost:8080/api/clinic';


// const formatTime = (timeString) => {
 // แยกเวลาออกจากรูปแบบ 'HH:mm:ss+ZZ' และแสดงแค่ 'HH:mm'
//   const time = timeString.split(':');  // แยกเป็น [ '16', '00', '00+07' ]
//   return `${time[0]}:${time[1]}`;  // คืนค่าแค่ '16:00'
// };
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

const AdmitTable = ({ appointments, onMoveToPending}) => {
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('appointment_date');
    const [appointmentHotel, setAppointmentHotel] = useState([]);
    const [loading, setLoading] = useState(false);

    const formatAppointmentDate = (date) => dayjs(date).format('DD/MM/YYYY');
    const fetchAppointments = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`${api}/appointment/hotel`);
          console.log('API Response:', response.data);
          setAppointmentHotel(response.data);
          
        } catch (error) {
          console.error('Error fetching appointments:', error);
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        fetchAppointments();
    }, [appointments]);

    const handleRequestSort = (event, property) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
    };
      
      
    const filteredAppointments = appointmentHotel.filter(appointment => {
        return appointment.queue_status === 'admit' && appointment.status === 'อนุมัติ';
      });

      console.log('filteredAppointments',filteredAppointments)
      console.log('appointmentHotel:', appointmentHotel);


      
      return (
        <Box>
          {/* แสดงข้อความแสดงชื่อ IPD Admit */}
          <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
            รายชื่อผู้ป่วยใน (IPD Admit)
          </Typography>
      
          {/* เช็คสถานะ loading */}
          {loading ? (
            <Typography variant="body1" color="textSecondary">
              กำลังโหลดข้อมูล...
            </Typography>
          ) : (
            <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                    <TableCell>
                     <TableSortLabel
                        active={orderBy === 'appointment_date'}
                        direction={orderBy === 'appointment_date' ? order : 'asc'}
                        onClick={(event) => handleRequestSort(event, 'appointment_date')}
                    >
                        วันที่
                    </TableSortLabel>
                     </TableCell>
                      <TableCell>เลขที่นัดหมาย</TableCell>
                      <TableCell>จำนวนวัน</TableCell>
                      <TableCell>ชื่อสัตว์</TableCell>
                      <TableCell>ชื่อเจ้าของ</TableCell>
                      <TableCell>สถานะ</TableCell>
                      <TableCell>สัตวแพทย์ผู้ดูแล</TableCell>
                      <TableCell>แถบสถานะ</TableCell> 
                      <TableCell sx={{ width: '30%' }}></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAppointments.sort(getComparator(order, orderBy)).map((appointment) => {
                      const today = dayjs(); // วันที่วันนี้
                      const endDate = dayjs(appointment.end_date); // แปลง end_date เป็น dayjs object
                      const isPastEndDate = appointment.end_date && endDate.isBefore(today, 'day'); // เช็คถ้าเกินกำหนด
                      const isEndDateToday = appointment.end_date && endDate.isSame(today, 'day'); // เช็คถ้าเป็นวันนี้
                      const backgroundColor = isPastEndDate
                        ? '#fa1f14' // สีแดงอ่อนหากเกินกำหนด
                        : isEndDateToday
                        ? '#fa9993' // สีแดงอีกเฉดหากเป็นวันสิ้นสุด
                        : appointment.status_hotel === 'เข้าพัก'
                        ? '#fffacd' // สีเหลืองสำหรับสถานะ 'เข้าพัก'
                        : 'transparent'; // สีพื้นหลังโปร่งใสสำหรับสถานะอื่น ๆ
                    
                      // สร้างข้อความสถานะ
                      const statusMessage = isPastEndDate
                        ? 'เกินกำหนด'
                        : isEndDateToday
                        ? 'วันสุดท้าย'
                        : 'ปกติ';
                    
                      return (
                        <TableRow key={appointment.appointment_id} >
                          <TableCell>{formatAppointmentDate(appointment.appointment_date)}</TableCell>
                          <TableCell>{appointment.appointment_id}</TableCell>
                          <TableCell>{appointment.num_day}</TableCell>
                          <TableCell>{appointment.pet_name}</TableCell>
                          <TableCell>{appointment.full_name}</TableCell>
                          <TableCell sx={{ color: 'red' }}>{appointment.queue_status}</TableCell>
                          <TableCell>{appointment.personnel_name}</TableCell> 
                         <TableCell>
                                <Box
                                  sx={{
                                    bgcolor: backgroundColor, // สีพื้นหลังตามเงื่อนไข
                                    fontWeight: isPastEndDate || isEndDateToday ? 'bold' : 'normal', // เน้นข้อความถ้าเป็นเงื่อนไขสีแดง
                                    width: '60%', // ขนาดของกล่องเป็น 60% ของช่อง
                                    padding: '4px', 
                                    borderRadius: '4px' 
                                }}>
                                    {statusMessage}
                                </Box>
                          </TableCell>
          
          
                          <TableCell>
                            <Box mt={1} display="flex" justifyContent="flex-end">
                              <Button
                                variant="contained"
                                color="secondary"
                                sx={{ mr: 1 }}
                                onClick={async () => {
                                  try {
                                    await onMoveToPending(appointment.appointment_id);
                                    await fetchAppointments();
                                  } catch (error) {
                                    console.error('Error in onClick action:', error);
                                  }
                                }}
                              >
                                ปล่อยกลับ
                              </Button>
                              
                              <Button variant="contained" color="primary">
                                บันทึกพักรักษา
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
          )}
        </Box>
      );
      
   
  };

export default AdmitTable