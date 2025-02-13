import React, { useState, useEffect,useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,Badge ,
} from '@mui/material';
import { styled } from '@mui/system';
import dayjs from 'dayjs';
import PostponeHotel from './PostponeHotel';
import ChooseVac from './ChooseVac';
import { clinicAPI } from "../../utils/api";
import 'dayjs/locale/th';  // นำเข้า locale ภาษาไทย
dayjs.locale('th'); // ตั้งค่าให้ dayjs ใช้ภาษาไทย


const categories = ['ฝากเลี้ยง','อาบน้ำ-ตัดขน', 'ตรวจรักษา', 'วัคซีน'];

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
  const [activeCategory, setActiveCategory] = useState('ฝากเลี้ยง');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('appointment_date');
  const [appointmentHotel, setAppointmentHotel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openPostponeDialog, setOpenPostponeDialog] = useState(false);
  const [openVaccineDialog, setOpenVaccineDialog] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentCounts, setAppointmentCounts] = useState({}); //นับจำนวนนัดหมายแยกประเภท 
  const [openRevertDialog, setOpenRevertDialog] = useState(false);
  const [revertAppointmentId, setRevertAppointmentId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const username = sessionStorage.getItem('username') ;
  const navigate = useNavigate();

  const fetchUserRole = useCallback(async () => {
    try {
      const response = await clinicAPI.get(`/personnel/${username}`);
      if (response.data.length > 0) {
        setUserRole(response.data[0].role);
        // console.log("response.data[0].role", response.data[0].role);
      } else {
        console.warn("User not found");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  }, [username]); // Add username as a dependency
  
  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]); // Now it's safely included
  
  useEffect(() => {
    if (sessionStorage.getItem("forceRoleUpdate") === "true") {
      fetchUserRole();
      sessionStorage.removeItem("forceRoleUpdate");
    }
  }, [fetchUserRole]); // Now it's safely included
  
  
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await clinicAPI.get(`/appointment/hotel`);
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

  const filteredData = sortedData(
    filterAppointments(
      activeCategory === 'ฝากเลี้ยง' ? appointmentHotel : appointments,
      activeCategory
    )
  );
  // console.log('filteredData',filteredData)
  // console.log('appointments',appointments)


  const handleOpenConfirmDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setSelectedAppointment(null);
  };

  const handleConfirmSendQueue = async () => {
    if (selectedAppointment) {
      await onMoveToPending(selectedAppointment.appointment_id);
    }
    handleCloseConfirmDialog();
  };
  const handleAppointmentAction = (appointment) => {
    switch (appointment.type_service) {
      case 'ฝากเลี้ยง':
        setSelectedAppointmentId(appointment.appointment_id);
        setSelectedPetId(appointment.pet_id);
        setOpenPostponeDialog(true);
        break;
  
      case 'วัคซีน':
        setSelectedAppointmentId(appointment.appointment_id);
        setSelectedPetId(appointment.pet_id);
        setOpenVaccineDialog(true);
        break;
  
      case 'อาบน้ำ-ตัดขน':
        handleOpenConfirmDialog(appointment);
        break;
  
      default:
        onMoveToPending(appointment.appointment_id);
    }
  };

  const handleButtonAction = async (appointment) => {
    try {
      // console.log('ownerId' , appointment.owner_id )
      switch (appointment.type_service) {
        case 'ฝากเลี้ยง':
          handleOpenConfirmDialog(appointment);
          // await onMoveToPending(appointment.appointment_id); // Action for "ปล่อยกลับ"
          // await fetchAppointments(); // อัปเดตข้อมูลใหม่
          break;
  
        case 'ตรวจรักษา':
          const pet = {
            petId: appointment.pet_id,
          };
          const owner = {
            ownerId: appointment.owner_id,
          };
          navigate('/clinic/pet-profile' ,  { state: { pet, owner , appointmentId: appointment.appointment_id, fromOngoing: true,}}
          )
          break;
  
  
        default:
          await  handleOpenRevertDialog(appointment.appointment_id)
          break;
      }
    } catch (error) {
      console.error('Error handling button action:', error);
    }
  };
  
  // นับจำนวนบริการแยกตามประเภท

  useEffect(() => {
    if (!appointments.length && !appointmentHotel.length) {
      // ถ้ายังไม่มีข้อมูล ไม่ต้องทำอะไร
      return;
    }
    const counts = categories.reduce((acc, category) => {
      const categoryAppointments =
        category === 'ฝากเลี้ยง'
          ? filterAppointments(appointmentHotel, category)
          : filterAppointments(appointments, category);
      acc[category] = categoryAppointments.length;
      return acc;
    }, {});
  
    setAppointmentCounts(counts);
  }, [appointments, appointmentHotel ]);
  
    const handleOpenRevertDialog = (appointmentId) => {
      setRevertAppointmentId(appointmentId);
      setOpenRevertDialog(true);
  };

  const handleCloseRevertDialog = () => {
      setOpenRevertDialog(false);
      setRevertAppointmentId(null);
  };


  const handleChangeCategory = (event, newValue) => {
    setActiveCategory(newValue);
  };


  return (
    <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={activeCategory} onChange={handleChangeCategory}>
      {categories.map((category) => (
        <StyledTab
          key={category}
          label={
            <Badge
              color="secondary"
              badgeContent={
                appointmentCounts[category] > 0 ? appointmentCounts[category] : null
              }
              invisible={appointmentCounts[category] === 0}
            >
              {category}
            </Badge>
          }
          value={category}
        />
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
                    <TableCell>ประเภทสัตว์เลี้ยง</TableCell>
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
                  : appointment.status_hotel === 'checkin'
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
                            width: '100%', // ขนาดของกล่องเป็น 60% ของช่อง
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
                        <TableCell>{appointment.pet_species}</TableCell>
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
                        onClick={() => handleButtonAction(appointment)}
                        // disabled={userRole !== 'สัตวแพทย์'}
                        disabled={
                          appointment.type_service === 'ตรวจรักษา' &&
                          userRole !== 'สัตวแพทย์'
                        }
                        
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
                          onClick={() => handleAppointmentAction(appointment)}
                          disabled={
                            appointment.type_service === 'วัคซีน' &&
                            userRole !== 'สัตวแพทย์'
                          }
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
                      
                      <ChooseVac
                       open={openVaccineDialog}
                       handleClose={() => setOpenVaccineDialog(false)}
                       appointmentId={selectedAppointmentId}
                       petId={selectedPetId}
                       TypeService={"วัคซีน"}
                       updateAppointments={fetchAppointments}
                       onMoveToPending={onMoveToPending} // ส่งฟังก์ชันนี้ไปเป็น prop
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
        {/* Confirm Dialog */}
        <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle id="confirm-dialog-title">ยืนยันการส่งคิว</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            คุณต้องการส่งคิวสำหรับสัตว์เลี้ยง {selectedAppointment?.pet_name} ไปชำระเงิน ใช่หรือไม่?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="secondary">
            ยกเลิก
          </Button>
          <Button onClick={handleConfirmSendQueue} color="primary">
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={openRevertDialog} onClose={handleCloseRevertDialog}>
        <DialogTitle>ยืนยันการคืนคิว</DialogTitle>
        <DialogContent>
            <DialogContentText>
                คุณต้องการคืนคิวสำหรับสัตว์เลี้ยง {selectedAppointment?.pet_name} ใช่หรือไม่?
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={handleCloseRevertDialog} color="secondary">
                ยกเลิก
            </Button>
            <Button
                onClick={() => {
                    onRevertToPending(revertAppointmentId);
                    handleCloseRevertDialog();
                }}
                color="primary"
            >
                ยืนยัน
            </Button>
        </DialogActions>
    </Dialog>

    </Paper>
  );
};

export default OngoingAppointments;
