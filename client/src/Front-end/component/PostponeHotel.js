import React, { useState, useEffect } from 'react';
import {
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Tab, Tabs, Autocomplete,Typography,Snackbar,Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { styled } from '@mui/material/styles';
import HolidayFilter from './HolidayFilter';
import { useNavigate  } from 'react-router-dom';
import { clinicAPI } from "../../utils/api";
dayjs.locale('th');

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  minWidth: 0,
  marginRight: theme.spacing(2),
  fontWeight: theme.typography.fontWeightRegular,
  '&:hover': {
    color: theme.palette.primary.main,
    opacity: 1,
  },
  '&.Mui-selected': {
    color: 'purple',
    backgroundColor: 'rgba(128, 0, 128, 0.2)',
    fontWeight: theme.typography.fontWeightMedium,
  },
}));

const PostponeHotel = ({ open, handleClose , appointmentId, petId , updateAppointments,isExtendBooking ,isAdmitBooking ,isCustomer}) => {
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [petCages, setPetCages] = useState([]);
  const [selectedCage, setSelectedCage] = useState('');
  const [personnelList, setPersonnelList] = useState([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState('');
  const [petSpecies, setPetSpecies] = useState('');
  const [openDialog , setOpenDialog] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState(''); // Snackbar message state
  const [snackbarColor, setSnackbarColor] = useState(''); // Snackbar color state
  const [initialCheckInDate, setInitialCheckInDate] = useState(null); 
  const [petName, setPetName] = useState('');
  const navigate = useNavigate();
  // console.log('checkInDate',checkInDate)
  // console.log('appointmentId',appointmentId)

  const resetFields = () => {
    setCheckInDate(initialCheckInDate);
    setCheckOutDate(null);
    setSelectedCage(null);
    setSelectedPersonnel(null);
  };
  const handleDialogClose = () => {
    setOpenDialog(false);
  };
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  const handlePostpone = async () => {
    try {
      if ((isExtendBooking && !checkInDate)|| !checkOutDate || !selectedCage || !selectedPersonnel) {
        setSnackbarMessage('กรุณาเลือกวันที่เข้าพัก!');
        setSnackbarColor('red');
        setSnackbarOpen(true);
        return;
      }

      const formatDate = (date) => dayjs(date).format('YYYY-MM-DD');

      // อัปเดตสถานะเป็น admit เมื่อ isAdmitBooking เป็น true
      if (isAdmitBooking) {
        await clinicAPI.put(`/appointment/${appointmentId}`, { status: 'อนุมัติ' , queue_status: 'admit', reason: 'admit' });
      }
      if (isCustomer) {
        const today = dayjs();
        const checkIn = dayjs(checkInDate);
        const daysUntilCheckIn = checkIn.diff(today, 'day');
  
        if (daysUntilCheckIn < 1) {
          setSnackbarMessage('ลูกค้าสามารถเลื่อนนัดได้ก่อนวันเข้าพักอย่างน้อย 1 วัน');
          setSnackbarColor('red');
          setSnackbarOpen(true);
          return;
        }
        await clinicAPI.put(`/appointment/${appointmentId}`, { status: 'รออนุมัติ', queue_status: 'รอรับบริการ' });
      }
  

      const response = await clinicAPI.put(`/postpone/hotels/${appointmentId}`, {
        start_date: formatDate(checkInDate),
        end_date: formatDate(checkOutDate),
        num_day : totalDays ,
        pet_cage_id: selectedCage,
        personnel_id: selectedPersonnel.personnel_id,
        pet_id : petId ,
        status : isAdmitBooking? 'checkin' : 'รอเข้าพัก'
      });

      if (response.status === 200) {
        setSnackbarOpen(true);
        setSnackbarMessage("ข้อมูลถูกอัปเดตสำเร็จ!");
        setSnackbarColor("green");  // Success color (green)
        updateAppointments();
        
        resetFields();
        handleClose(); 
        if (isAdmitBooking) {
          navigate('/clinic/home', {
            state: {
              locationActiveTab: 1,
            },
          });
        }
      }
    } catch (error) {
    console.error('Failed to update appointment:', error);
      setSnackbarMessage('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      setSnackbarColor('red');
      setSnackbarOpen(true);
    }
    setOpenDialog(false);
  };

  
  const totalDays = checkInDate && checkOutDate
  ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  

  const handleTabChange = (event, newValue) => setActiveTab(newValue);

  useEffect(() => {
    const fetchPetSpecies = async () => {
      try {
        const response = await clinicAPI.get(`/pets/${petId}`);
        setPetSpecies(response.data.pet_species);
        setPetName(response.data.pet_name);
      } catch (error) {
        console.error('Error fetching pet species:', error);
      }
    };
    if (petId) {
      fetchPetSpecies();
    }
  }, [petId]);
  

  useEffect(() => {
    const fetchAvailableCages = async () => {
      const formattedCheckInDate = checkInDate ? dayjs(checkInDate).format('YYYY-MM-DD') : null;
      const formattedCheckOutDate = checkOutDate ? dayjs(checkOutDate).format('YYYY-MM-DD') : null;
      if (formattedCheckInDate && formattedCheckOutDate && petSpecies) {
        try {
          const response = await clinicAPI.get(
            `/available-cages?start_date=${formattedCheckInDate}&end_date=${formattedCheckOutDate}&pet_species=${petSpecies}`
          );
          setPetCages(response.data);
        } catch (error) {
          console.error('Error fetching available cages:', error);
        }
      }
    };
    fetchAvailableCages();
  }, [checkInDate, checkOutDate, petSpecies]);

  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const response = await clinicAPI.get(`/personnel`);
        setPersonnelList(response.data);
      } catch (error) {
        console.error('Error fetching personnel:', error);
      }
    };
    fetchPersonnel();
  }, []);

  useEffect(() => {
    if ( appointmentId) { 
      const fetchAppointmentDetails = async () => {
        try {
          const response = await clinicAPI.get(`/appointments/${appointmentId}`);
          // console.log('Response from API:', response.data); // ตรวจสอบข้อมูลที่ส่งกลับมา
          const appointmentDate = new Date(response.data.appointment_date);
          setInitialCheckInDate(appointmentDate);
          //console.log('Initial Check-in Date:', appointmentDate);
          setCheckInDate(appointmentDate); // ล็อกวันที่
          //console.log('Check-in Date Set:', appointmentDate);
        } catch (error) {
          console.error('Error fetching appointment details:', error);
        }
      };
      fetchAppointmentDetails();
    }
  }, [ appointmentId ]);
  

  return (
    
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={() => { resetFields(); handleClose(); }} maxWidth="md" fullWidth 
        BackdropProps={{
            style: { backgroundColor: 'rgba(0, 0, 0, 0.1)' } // ตั้งค่าโปร่งแสงของพื้นหลัง
          }}
        PaperProps={{
            sx: { boxShadow: 'none' } // ปิดเงาของ Dialog
          }}
          >
        <DialogTitle>
          {isAdmitBooking ? "กรอกข้อมูลสำหรับพักรักษา (Admit)" : "เลือก วัน-เวลา นัดหมายใหม่"}
        </DialogTitle>

        <DialogContent dividers>

          <Box display="flex" flexDirection="column" gap={2}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="secondary"
            textColor="inherit"
            variant="fullWidth"
        >
            <StyledTab label="ค้างคืน" />
            {!isExtendBooking && !isAdmitBooking && <StyledTab label="ระหว่างวัน" />} {/* ซ่อนแท็บนี้เมื่อ isExtendBooking เป็น true */}

            
        </Tabs>
          {activeTab === 0 && (
            <>
            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column', width: '100%' }}>
              {isExtendBooking && (
                <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                  * ไม่สามารถเปลี่ยนวันที่เข้าพักได้สำหรับการขยายการจอง
                </Typography>
              )}
              {isAdmitBooking && (
              <Box>
                 <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                * ไม่สามารถเปลี่ยนวันที่เข้าพักได้
                </Typography>
              </Box>
               )}
               
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                {isExtendBooking || isAdmitBooking ? (
                  // แสดง TextField แบบ readOnly เมื่อเป็นการจองต่อ + admit
                  <TextField
                    label="Check-in Date"
                    value={dayjs(checkInDate).format('DD/MM/YYYY')} // ฟอร์แมตวันที่
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{ width: '50%' }}
                  />
                ) : (
                  // ใช้ DatePicker เมื่อไม่ได้จองต่อ
                <HolidayFilter>
                  <DatePicker
                    label="Check-in Date"
                    value={checkInDate}
                    onChange={(newDate) => setCheckInDate(newDate)}
                    TextFieldComponent={(params) => <TextField {...params} fullWidth />}
                    disablePast
                    views={['year', 'month', 'day']}
                    format="dd/MM/yyyy"
                    sx={{  flexGrow: 1 }}
                  />
                </HolidayFilter>
                )}
                <HolidayFilter>
                  <DatePicker
                    label="Check-out Date"
                    value={checkOutDate}
                    onChange={(newDate) => setCheckOutDate(newDate)}
                    TextFieldComponent={(params) => <TextField {...params} fullWidth />}
                    disablePast
                    minDate={checkInDate} //ไม่สามารถเลือก Check-out Date ที่น้อยกว่าหรือเท่ากับ Check-in Date ได้
                    views={['year', 'month', 'day']}
                    format="dd/MM/yyyy"
                    sx={{ flexGrow: 1 }} // ขยายเต็มพื้นที่
                  />
                </HolidayFilter>
              </Box>
              <Box>
                {checkInDate && checkOutDate && totalDays > 0 && (
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Total Days: {totalDays}
                  </Typography>
                )}
              </Box>
            </Box>
            </>
          )}
          {activeTab === 1 && !isExtendBooking && (
          <HolidayFilter>
            <DatePicker
              label="เลือกวันที่"
              value={checkInDate}
              onChange={(newDate) => {
                setCheckInDate(newDate);
                setCheckOutDate(newDate);
              }}
              TextFieldComponent={(params) => <TextField {...params} fullWidth />}
              disablePast
              format="dd/MM/yyyy"
              views={['year', 'month', 'day']}
            />
          </HolidayFilter>
          )}
          <Autocomplete
            options={petCages}
            getOptionLabel={(cage) => `ID: ${cage.pet_cage_id} - ที่ว่าง: ${cage.cage_capacity - (cage.reserved_count || 0)}  (${cage.cage_capacity}) `}
            onChange={(event, value) => setSelectedCage(value ? value.pet_cage_id : null)}
            renderInput={(params) => <TextField {...params} label="เลือกกรง" />}
            isOptionEqualToValue={(option, value) => option.pet_cage_id === value.pet_cage_id}
          />
          <Autocomplete
            options={personnelList}
            getOptionLabel={(personnel) => personnel ? `${personnel.first_name} ${personnel.last_name} (${personnel.role}) ` : ''}
            onChange={(event, value) => setSelectedPersonnel(value || null)}
            value={selectedPersonnel ? personnelList.find(p => p.personnel_id === selectedPersonnel.personnel_id) : null}
            isOptionEqualToValue={(option, value) => option?.personnel_id === value?.personnel_id}
            renderInput={(params) => <TextField {...params} label="ผู้บันทึก" variant="outlined" fullWidth />}
          />
        </Box>


        </DialogContent>
        <DialogActions>
          <Button onClick={() => { resetFields(); handleClose(); }}>ยกเลิก</Button>
          <Button onClick={() => setOpenDialog(true)} color="primary">
            {isAdmitBooking ? "บันทึกข้อมูลพักรักษา" : "ยืนยัน"}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        sx={{
            '& .MuiSnackbarContent-root': {
            backgroundColor: snackbarColor === 'red' ? '#f44336' : 'green', // เปลี่ยนสีเป็นแดงถ้า snackbarColor เป็น 'red'
            },
        }}
        />
      <Dialog open={openDialog} onClose={handleDialogClose}>
      <DialogTitle>
          {isAdmitBooking ? 'ยืนยันการเข้าพักรักษา' : 'ยืนยันการเลื่อนนัดหมาย'}
      </DialogTitle>
        <DialogContent>
         <Typography>
          {isAdmitBooking
            ? `คุณแน่ใจหรือไม่ว่าต้องการรับ ${petName} เข้าพักรักษา`
            : 'คุณแน่ใจหรือไม่ว่าต้องการเลื่อนนัดหมายนี้'}
        </Typography>
        </DialogContent>
        <DialogActions>
            <Button onClick={handleDialogClose} color="error">ยกเลิก</Button>
            <Button onClick={handlePostpone} color="primary">ยืนยัน</Button>
        </DialogActions>
    </Dialog>

    </LocalizationProvider>
  );
};

export default PostponeHotel;
