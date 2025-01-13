import React, { useState, useEffect , useMemo ,useCallback} from 'react';
import { Box, Button, Typography, Paper, MenuItem, Select, FormControl, InputLabel, TextField, Autocomplete,
  Tabs, Tab,Checkbox, FormControlLabel,Snackbar  ,Dialog, DialogActions, 
  DialogContent, DialogTitle,} from '@mui/material';
import axios from 'axios';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import TimeSlotPicker from './TimeSlot';
import Alert from '@mui/material/Alert';
import CheckIcon from '@mui/icons-material/Check';
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';
import {useLocation,useNavigate} from 'react-router-dom';
import HolidayFilter from './HolidayFilter';
const MemoizedAutocomplete = React.memo(Autocomplete);


const api = 'http://localhost:8080/api/clinic';


const categories = ['ทั้งหมด', 'อาบน้ำ-ตัดขน', 'ตรวจรักษา', 'ฝากเลี้ยง', 'วัคซีน'];
const sub_categories = ['จ่ายยา','ทำแผล','ตรวจทั่วไป','ดูอาการ',] ;

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
    color: 'purple', // Change the text color for the selected tab
    backgroundColor: 'rgba(128, 0, 128, 0.2)', // Optional: background color when selected
    fontWeight: theme.typography.fontWeightMedium,
  },
  '&.Mui-focusVisible': {
    backgroundColor: 'rgba(100, 95, 228, 0.32)',
  },
  '& .MuiTabs-indicator': {
    backgroundColor: 'purple', // Change the color of the tab indicator
  },
  
}));

const AddAppointment = ({isCustomerAppointment , ownerID}) => {
  const [owners, setOwners] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [TypeService, setTypeService] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(null);
  const [appointmentTime, setAppointmentTime] = useState(null);
  const [reason, setReason] = useState('');
  const [searchOwner, setSearchOwner] = useState('');
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [alertMessage, setAlertMessage] = useState(''); 
  const [alertSeverity, setAlertSeverity] = useState('success'); 
  const [petCages, setPetCages] = useState([]);
  const [selectedCage, setSelectedCage] = useState('');
  const [petSpecies, setPetSpecies] = useState('');
  const [personnelList, setPersonnelList] = useState([]); 
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [detailservice,setDetailService] = useState('') ;
  const [activeTab, setActiveTab] = useState(0);
  const [isNoTime, setIsNoTime] = useState(false); // Checkbox state
  const [timePickerKey, setTimePickerKey] = useState(0);
  const [openDialog , setOpenDialog] = useState(false)
  const location = useLocation();
  const { locationOwnerID ,locationPetID } = location.state || {};
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user')); 

  useEffect(() => {
    if (locationOwnerID !== undefined && locationOwnerID !== selectedOwnerId) {
      setSelectedOwnerId(locationOwnerID);
    }
    const fetchOwners = async () => {
      try {
        const response = await axios.get(`${api}/owners`);
        setOwners(response.data);
      } catch (error) {
        console.error('Error fetching owners:', error);
      }
    };
    fetchOwners();
  }, [locationOwnerID, selectedOwnerId]);
  

  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const response = await axios.get(`${api}/personnel`);
        console.log('response',response)
        setPersonnelList(response.data);
      } catch (error) {
        console.error('Error fetching personnel:', error);
      }
    };
    fetchPersonnel();
 
  }, []);
 
  
  useEffect(() => {
    const fetchFilteredOwners = async () => {
      try {
        const response = await axios.get(`${api}/owners?search=${searchOwner}`);
        setOwners(response.data);
      } catch (error) {
        console.error('Error fetching owners:', error);
      }
    };
    searchOwner.length > 0 ? fetchFilteredOwners() : setOwners([]);
  }, [searchOwner]);

  //กรณีที่ isCustomerAppointment = true ดึงค่า owner_id มาเซตค่า เพื่อเสริชสัตว์เลี้ยง
  useEffect(() => {
    if (isCustomerAppointment && ownerID) {
      setSelectedOwnerId(ownerID); // ตั้งค่า selectedOwnerId ด้วยค่า ownerID ที่ได้รับ
    }
  }, [isCustomerAppointment, ownerID]);
  

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await axios.get(`${api}/pets?owner_id=${selectedOwnerId}`);
        setPets(response.data);
        setSelectedPetId(locationPetID || "");
      } catch (error) {
        console.error("Error fetching pets:", error);
      }
    };
  
    if (selectedOwnerId) {
      fetchPets();
    } else {
      setPets([]);
    }
  }, [selectedOwnerId, locationPetID]);
  


  useEffect(() => {
    const fetchAvailableCages = async () => {
      const formattedCheckInDate = checkInDate ? dayjs(checkInDate).format('YYYY-MM-DD') : null;
      const formattedCheckOutDate = checkOutDate ? dayjs(checkOutDate).format('YYYY-MM-DD') : null;
      if (formattedCheckInDate && formattedCheckOutDate) {
        try {
          const response = await axios.get(
            `${api}/available-cages?start_date=${formattedCheckInDate}&end_date=${formattedCheckOutDate}&pet_species=${petSpecies}`
          );
          setPetCages(response.data); 
          console.log('cage' , response.data) // ตั้งค่า petCages เป็นข้อมูลที่กรองแล้วจาก Backend
        } catch (error) {
          console.error('Error fetching available cages:', error);
        }
      }
    };
    fetchAvailableCages();
  
  }, [checkInDate, checkOutDate ,petSpecies]);


  const handlePetChange = (event, value) => {
    setSelectedPetId(value ? value.pet_id : '');
    setPetSpecies(value ? value.pet_species : '');
  };
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    console.log('Active Tab:', newValue);

  };
  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleDateChange = useCallback((dateType, newDate) => {
    console.log("Selected Date: ", newDate);
    if (dateType === 'checkIn') {
      setCheckInDate(newDate);
      if (activeTab === 1) setCheckOutDate(newDate); // สำหรับ Daytime Booking
    } else if (dateType === 'checkOut') {
      setCheckOutDate(newDate);
    }
  }, [activeTab]);  // Depend on activeTab

  const filteredCages = useMemo(() => {
    return petCages
      .filter(cage => cage.pet_cage_id && cage.cage_capacity) // กรองข้อมูลที่ไม่สมบูรณ์ออก
      .map(cage => ({
        label: `ID: ${cage.pet_cage_id} - ที่ว่าง: ${cage.cage_capacity - (cage.reserved_count || 0)} (${cage.cage_capacity})`,
        id: cage.pet_cage_id,
      }));
  }, [petCages]);
  
  const filteredPersonnel = useMemo(() => {
    return personnelList
      .filter(personnel => personnel.personnel_id && personnel.first_name && personnel.last_name) // กรองข้อมูลที่ไม่สมบูรณ์ออก
      .map(personnel => ({
        label: `${personnel.first_name} ${personnel.last_name} (${personnel.role})`,
        id: personnel.personnel_id,
      }));
  }, [personnelList]);
  
    
  const createAppointment = async () => {
    try {
      if(TypeService !== 'ฝากเลี้ยง'){
        if (!appointmentDate || (!appointmentTime && !isNoTime)) {
          setAlertSeverity('warning');
          setAlertMessage('กรุณากรอกข้อมูลให้ครบ');
          return;
        }
      }else {
        if (!checkInDate || !checkOutDate || !petCages  || !isNoTime ) {
          setAlertSeverity('warning');
          setAlertMessage('กรุณากรอกข้อมูลให้ครบ');
          return;
        }
      }

      let appointmentData = {
        owner_id: selectedOwnerId,
        pet_id: selectedPetId,
        type_service: TypeService,
        status: isCustomerAppointment ? 'รออนุมัติ' : 'อนุมัติ', // เปลี่ยนสถานะตามเงื่อนไข
        queue_status: 'รอรับบริการ',
        personnel_id: selectedPersonnel ? selectedPersonnel.personnel_id : null,
        
      };
  
      // เพิ่มข้อมูลวันและเวลาถ้าเป็นประเภทอื่นที่ไม่ใช่ 'ฝากเลี้ยง'
      if (TypeService !== 'ฝากเลี้ยง') {
        const formattedTime = appointmentTime ? formatTime(appointmentTime) : null;
        const formattedDate = appointmentDate ? dayjs(appointmentDate).format('YYYY-MM-DD') : null;
  
        appointmentData = {
          ...appointmentData,
          appointment_date: formattedDate,
          appointment_time: formattedTime,
          reason: `${reason ? reason : ''}${reason && detailservice ? ' - ' : ''}${detailservice ? detailservice : ''}`,
          detail_service:  isNoTime === true ? 'Walk-in' : 'นัดหมาย',
        };
      } else {
        // กรณีเป็น "ฝากเลี้ยง" ให้เพิ่มข้อมูลการจองกรง
        appointmentData = {
          ...appointmentData,
          start_date: checkInDate ? dayjs(checkInDate).format('YYYY-MM-DD') : '',
          end_date: checkOutDate ? dayjs(checkOutDate).format('YYYY-MM-DD') : '',
          pet_cage_id: selectedCage,
          detail_service: activeTab === 0 ? 'ค้างคืน' : 'ระหว่างวัน',
        };
      }
  
      // ส่งข้อมูลไปยัง API
      const { data: appointmentResponse } = await axios.post(`${api}/create-appointment`, appointmentData);
  
      // ตรวจสอบการตอบกลับ
      console.log('Appointment Response:', appointmentResponse);
      if (appointmentResponse.error) {
        setAlertSeverity('error');
        setAlertMessage(appointmentResponse.error);
      } else {
        resetForm();
        setAlertSeverity('success');
        setAlertMessage('เพิ่มการนัดหมายสำเร็จ.');
        if (isCustomerAppointment) {
          navigate('/customer/home');
        }
      }
  
      setTimeout(() => setAlertMessage(''), 2000);
  
    } catch (error) {
      console.error('Error creating appointment:', error);
      setAlertSeverity('error');
      setAlertMessage('กรุณาตรวจสอบการนัดหมายใหม่.');
      setTimeout(() => setAlertMessage(''), 2000);
    }
    setOpenDialog(false);
  };
  
  // Helper function สำหรับการจัดรูปแบบเวลา
  const formatTime = (time) => {
    const [startTime] = time.split(' - ');
    const [hours, minutes] = startTime.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
  };
  

  const resetForm = () => {
    setSelectedOwnerId('');
    setSelectedPetId('');
    setTypeService('');
    setAppointmentDate(null);
    setAppointmentTime(null);
    setReason('');
    setCheckInDate('');
    setCheckOutDate('');
    setSelectedPersonnel(null);
    setDetailService('')
    setTimePickerKey(timePickerKey + 1);
    setIsNoTime(false)
  };

  useEffect(() => {
    if (isCustomerAppointment) {
      const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim(); // ตรวจสอบค่า null และลบช่องว่างที่ไม่จำเป็น
      setSearchOwner(fullName); // เซ็ตชื่อเต็มลงใน setSearchOwner
    } else {
      setSearchOwner(''); // ล้างค่าหากไม่ใช่ Customer Appointment
    }
  }, [isCustomerAppointment, user?.first_name, user?.last_name]);
  

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>  
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          เพิ่มการนัดหมายใหม่
        </Typography>
        {alertMessage && (
          <Alert severity={alertSeverity} icon={alertSeverity === 'success' ? <CheckIcon fontSize="inherit" /> : undefined}>
            {alertMessage}
          </Alert>
        )}
        <Snackbar open={!!alertMessage} autoHideDuration={6000} 
         anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
        }}
        onClose={() => setAlertMessage('')}>
        <Alert onClose={() => setAlertMessage('')} severity={alertSeverity}>
          {alertMessage}
        </Alert>
        </Snackbar>

        <Box display="flex" flexDirection="column" gap={2}>
         
          <Autocomplete
            options={isCustomerAppointment ? [] : owners} // หาก isCustomerAppointment เป็น true จะไม่แสดงตัวเลือกจาก owners
            getOptionLabel={(owner) => `${owner.first_name} ${owner.last_name}`}
            onChange={(event, value) => setSelectedOwnerId(value ? value.owner_id : '')}
            value={
              isCustomerAppointment
                ? { first_name: user.first_name, last_name: user.last_name } // เมื่อ isCustomerAppointment เป็น true ให้แสดงชื่อ user
                : selectedOwnerId
                ? owners.find(owner => owner.owner_id === selectedOwnerId) // หากเลือกเจ้าของจากรายการ
                : null
            }
            isOptionEqualToValue={(option, value) =>
              option.first_name === value.first_name && option.last_name === value.last_name
            }
            renderInput={(params) => 
              <TextField {...params} 
                label="Select Owner" 
                variant="outlined" 
                fullWidth
                onChange={(e) => {
                  if (!isCustomerAppointment) {
                    setSearchOwner(e.target.value); // อนุญาตให้ค้นหาผู้เป็นเจ้าของเมื่อ isCustomerAppointment เป็น false
                  }
                }}
              />}
            // getOptionSelected={(option, value) => option.owner_id === value.owner_id}
            renderOption={(props, option) => (
              <li {...props} key={option.owner_id}>
                {`${option.first_name} ${option.last_name}`}
              </li>
            )}
            disabled={isCustomerAppointment} //ปิดกล่องไม่ให้เลือก
          />

          <Autocomplete
            options={pets}
            getOptionLabel={(pet) => pet.pet_name}
            isOptionEqualToValue={(option, value) => option.pet_id === value.pet_id}
            onChange= {handlePetChange}
            value={selectedPetId ? pets.find(pet => pet.pet_id === selectedPetId) : null}
            renderInput={(params) => (
              <TextField {...params} 
                label="Select Pet" 
                variant="outlined" 
                fullWidth />
            )}
          />
          <FormControl fullWidth>
            <InputLabel id="appointment-type-label">ประเภทการนัดหมาย</InputLabel>
            <Select
              labelId="appointment-type-label"
              id="appointment-type"
              value={TypeService}
              onChange={(e) => {
                console.log(e.target.value); // Debug to check if the value is correct
                setTypeService(e.target.value);
                setIsNoTime(false);
              }}
              label="ประเภทการนัดหมาย"
            >
              {categories.slice(1).map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          
          {TypeService === 'ฝากเลี้ยง' ? (
            <>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              indicatorColor="secondary"
              textColor="inherit"
              variant="fullWidth"
              aria-label="full width tabs example"
              >
                <StyledTab label="ค้างคืน" id="tab-overnight" />
                <StyledTab label="ระหว่างวัน" id="tab-daytime" />
            </Tabs>
                  
            {activeTab === 0 && (
                <>
                  {/* Overnight Booking (ค้างคืน) */}
                  <HolidayFilter>
                    <DatePicker 
                      label="Check-in Date"
                      value={checkInDate}
                      onChange={(newDate) => handleDateChange('checkIn', newDate)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                      disablePast
                      views={['year', 'month', 'day']}
                    />
                  </HolidayFilter>
                  <HolidayFilter>
                    <DatePicker
                      label="Check-out Date"
                      value={checkOutDate}
                      onChange={(newDate) => handleDateChange('checkOut', newDate)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                      disablePast
                      views={['year', 'month', 'day']}
                    />
                  </HolidayFilter>
                  {checkInDate && checkOutDate && (
                    <p>Total Days: {Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))}</p>
                  )}
                </>
              )}

              {activeTab === 1 && (
                <>
                  {/* Daytime Booking (ระหว่างวัน) */}
                  <HolidayFilter>
                    <DatePicker 
                      label="เลือกวันที่"
                      value={checkInDate}
                      onChange={(newDate) => handleDateChange('checkIn', newDate)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                      disablePast
                      views={['year', 'month', 'day']}
                    />
                  </HolidayFilter>
                </>
              )}

              <TextField
               label="ประเภทสัตว์เลี้ยง"
               value={selectedPetId ? pets.find(pet => pet.pet_id === selectedPetId)?.pet_species : ''}
               InputProps={{
               readOnly: true,}}
               variant="outlined"
              fullWidth
            />
              
              <MemoizedAutocomplete
                options={filteredCages}
                getOptionLabel={(cage) => cage.label}
                onChange={(event, value) => setSelectedCage(value ? value.id : '')}
                renderInput={(params) => (
                  <TextField {...params} label="กรงฝากเลี้ยง" variant="outlined" fullWidth />
                )}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
              />

              {!isCustomerAppointment && (
                    <MemoizedAutocomplete
                      options={filteredPersonnel}
                      getOptionLabel={(personnel) => personnel.label || ''} // ป้องกัน label เป็น undefined
                      onChange={(event, value) => setSelectedPersonnel(value || null)} // บันทึกค่าที่เลือก
                      value={selectedPersonnel} // ใช้ selectedPersonnel โดยตรง
                      isOptionEqualToValue={(option, value) => option.id === value?.id} // ตรวจสอบความเท่ากันของ id
                      renderInput={(params) => (
                        <TextField {...params} label="ผู้บันทึก" variant="outlined" fullWidth />
                      )}
                    />
                  )}
            </>
          ) : ( 
            <HolidayFilter>
              <DatePicker
                label="เลือกวันที่"
                value={appointmentDate}
                onChange={(newDate) => setAppointmentDate(newDate)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                disablePast
                views={['year', 'month', 'day']}
              />
            </HolidayFilter>
          )}

        {TypeService === 'ตรวจรักษา' && (
          <>
          <FormControl fullWidth>
          <InputLabel id="appointment-type-label">นัดมา</InputLabel>
          <Select
            labelId="appointment-type-label"
            id="appointment-subtype"
            value={detailservice}
            onChange={(e) => {
              console.log(e.target.value); // Debug to check if the value is correct
              setDetailService(e.target.value);
            }}
            label="นัดมา"
          > 
            {sub_categories.map(sub_categories => (
              <MenuItem key={sub_categories} value={sub_categories}>
                {sub_categories}
              </MenuItem>
            ))}
          </Select>
        </FormControl>  
        <Autocomplete
          options={personnelList.filter(personnel => personnel.role === 'สัตวแพทย์')}
          getOptionLabel={(personnel) => personnel ? `${personnel.first_name} ${personnel.last_name}` : ''}
          onChange={(event, value) => setSelectedPersonnel(value || null)}
          value={selectedPersonnel ? personnelList.find(p => p.personnel_id === selectedPersonnel.personnel_id) : null}
          renderInput={(params) => (
        <TextField {...params} label="พบสัตวแพทย์" variant="outlined" fullWidth />
      )}
      />
          </>
        )}
         <Box>
        <FormControlLabel control={
              <Checkbox  
              checked={isNoTime}  
              onChange={(e) => {
              setIsNoTime(e.target.checked);
              setAppointmentTime(e.target.checked ? null : ''); // Set to null when checked
            }}/>}
              label="ไม่ระบุเวลา"
        />
        </Box>
        {!isNoTime && (<TimeSlotPicker //เช็คว่าได้เลือกcheckbox มั้ย และเรียกcomponent slottime ตามประเภทที่เลือก
          value={appointmentTime}
          key={timePickerKey}
          onChange={setAppointmentTime}
          TypeService={TypeService} 
          selectedDate={appointmentDate}
          onTimeSelect={setAppointmentTime} 
        />)}

          <TextField
            label="รายละเอียดการนัดหมาย"
            variant="outlined"
            multiline
            rows={4}
            fullWidth
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)}>
            บันทึกการนัดหมาย
          </Button>
        </Box>
      </Paper>
      <Dialog open={openDialog} onClose={handleDialogClose}>

    <DialogTitle>ยืนยันการจองนัดหมาย</DialogTitle>
    <DialogContent>
    <Typography>คุณแน่ใจหรือไม่ว่าต้องการจองนัดหมายนี้</Typography>

    </DialogContent>
    <DialogActions>
      <Button onClick={handleDialogClose} color="error">ยกเลิก</Button>
      <Button onClick={createAppointment} color="primary">ยืนยัน</Button>
    </DialogActions>
  </Dialog>
    </LocalizationProvider>
  );
};

export default AddAppointment