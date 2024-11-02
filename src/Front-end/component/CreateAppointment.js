import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, MenuItem, Select, FormControl, InputLabel, TextField, Autocomplete,Tabs, Tab,Checkbox, FormControlLabel} from '@mui/material';
import axios from 'axios';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import TimeSlotPicker from './TimeSlot';
import Alert from '@mui/material/Alert';
import CheckIcon from '@mui/icons-material/Check';
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';



const api = 'http://localhost:8080';


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

const AddAppointment = () => {
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
  const [selectedPersonnel, setSelectedPersonnel] = useState('');
  const [detailservice,setDetailService] = useState('') ;
  const [activeTab, setActiveTab] = useState(0);
  const [isNoTime, setIsNoTime] = useState(false); // Checkbox state
  const [timePickerKey, setTimePickerKey] = useState(0);
  
  // const isFormValid = isNoTime || (appointmentTime !== null && appointmentTime !== '');
  


  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const response = await axios.get(`${api}/owners`);
        setOwners(response.data);
      } catch (error) {
        console.error('Error fetching owners:', error);
      }
    };
    fetchOwners();
  }, []);

  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const response = await axios.get(`${api}/personnel`);
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

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await axios.get(`${api}/pets?owner_id=${selectedOwnerId}`);
        setPets(response.data);
        setSelectedPetId('');
      } catch (error) {
        console.error('Error fetching pets:', error);
      }
    };
    selectedOwnerId ? fetchPets() : setPets([]);
  }, [selectedOwnerId]);

  useEffect(() => {
    const fetchPetCages = async () => {
      try {
        const response = await axios.get(`${api}/petcage?pet_species=${petSpecies}`);
        setPetCages(response.data);
      } catch (error) {
        console.error('Error fetching pet cages:', error);
      }
    };
    petSpecies && fetchPetCages();
  }, [petSpecies]);
  


  const handlePetChange = (event, value) => {
    setSelectedPetId(value ? value.pet_id : '');
    setPetSpecies(value ? value.pet_species : '');
  };
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  
  const createAppointment = async () => {

    if (!selectedOwnerId || !selectedPetId || !TypeService || !appointmentDate || 
      (!isNoTime && !appointmentTime) || (TypeService === 'ฝากเลี้ยง' && (!checkInDate || !checkOutDate || !selectedCage))) {
      setAlertSeverity('error');
      setAlertMessage('กรุณากรอกข้อมูลให้ครบถ้วน!');
      return;
  }

    try {
      let appointmentData = {
        owner_id: selectedOwnerId,
        pet_id: selectedPetId,
        type_service: TypeService,
        status: 'รออนุมัติ', //ถ้าจองโดยลูกค้าจะเป็น รออนุมัติ
        queue_status:'รอรับบริการ',
        

        personnel_id: selectedPersonnel ? selectedPersonnel.personnel_id : null, 
        
      };
  
      // If TypeService is not 'ฝากเลี้ยง', include AppointmentDate, AppointmentTime, and Reason
      if ( TypeService !== 'ฝากเลี้ยง') {
        // const formattedDate = appointmentDate ? appointmentDate.toLocaleDateString('en-TH').split('T')[0] : null;
        const formattedTime = appointmentTime ? (() => {
          const [startTime] = appointmentTime.split(' - ');
          const [hours, minutes] = startTime.split(':');
          return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
        })() : null;
        const formattedDate = appointmentDate ? dayjs(appointmentDate).format('YYYY-MM-DD') : null;

        console.log("Formatted Date:", formattedDate);
       console.log("Formatted Time:", formattedTime);
      
  
        appointmentData = {
          ...appointmentData,
          appointment_date: formattedDate,
          appointment_time: formattedTime,
          reason: reason || null,
          detail_service : detailservice || null
        };
      }
      
  
      // Create appointmen
      const { data } = await axios.post(`${api}/create-appointment`, appointmentData);
      if (TypeService === 'ฝากเลี้ยง') await createPetHotelEntry(data.AppointmentID);
  
  

      resetForm();
      setAlertSeverity('success');
      setAlertMessage('เพิ่มการนัดหมายสำเร็จ.');

      setTimeout(() => {
        setAlertMessage('');
      }, 2000);

    } catch (error) {
      console.error('Error creating appointment:', error);
      setAlertSeverity('error');
      setAlertMessage('กรุณาตรวจสอบการนัดหมายใหม่.');

      setTimeout(() => {
        setAlertMessage('');
      }, 2000);
    }
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
  };
  
  // Function to create a PetHotel entry
  const createPetHotelEntry = async (appointmentID) => {
      const numDays = checkInDate && checkOutDate ? Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) : 0;
      const petHotelData = {
        appointment_id: appointmentID,
        pet_id: selectedPetId,
        entry_date: checkInDate ? dayjs(checkInDate).format('YYYY-MM-DD') : '',
        exit_date: checkOutDate ? dayjs(checkOutDate).format('YYYY-MM-DD') : '',
        num_day: numDays,
        status: '', 
        pet_cage_id : selectedCage
      };

  
      // Create PetHotel entry
    try {
      await axios.post(`${api}/create-pet-hotel`, petHotelData);
      // alert("PetHotel entry created successfully!");
    } catch (error) {
      console.error('Error creating PetHotel entry:', error);
      alert('Failed to create PetHotel entry.');
    }
  };
  

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
        <Box display="flex" flexDirection="column" gap={2}>
          <Autocomplete
            options={owners}
            getOptionLabel={(owner) => `${owner.first_name} ${owner.last_name}`}
            onChange={(event, value) => setSelectedOwnerId(value ? value.owner_id : '')}
            value={selectedOwnerId ? owners.find(owner => owner.owner_id === selectedOwnerId) : null}
            renderInput={(params) => 
              <TextField {...params} 
                label="Select Owner" 
                variant="outlined" 
                fullWidth
                onChange={(e) => setSearchOwner(e.target.value)} />}
            getOptionSelected={(option, value) => option.owner_id === value.owner_id}  
            renderOption={(props, option) => (
              <li {...props} key={option.owner_id}> {/* Set unique key here */}
                {`${option.first_name} ${option.last_name}`}
              </li>
            )}
          />
          <Autocomplete
            options={pets}
            getOptionLabel={(pet) => pet.pet_name}
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
                <StyledTab label="ค้างคืน" />
                <StyledTab label="ระหว่างวัน" />
            </Tabs>
                  
            {activeTab === 0 && (
              <>
                {/* Overnight Booking (ค้างคืน) */}
                <DatePicker 
                  label="Check-in Date"
                  value={checkInDate}
                  onChange={(newDate) => setCheckInDate(newDate)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  disablePast
                  views={['year', 'month', 'day']}
                />
                <DatePicker
                  label="Check-out Date"
                  value={checkOutDate}
                  onChange={(newDate) => setCheckOutDate(newDate)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  disablePast
                  views={['year', 'month', 'day']}
                />
                {checkInDate && checkOutDate && (
                  <p>Total Days: {Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))}</p>
                )}
              </>
            )}
        
            {activeTab === 1 && (
              <>
                {/* Daytime Booking (ระหว่างวัน) */}
                <DatePicker 
                  label="เลือกวันที่"
                  value={appointmentDate}
                  onChange={(newDate) => setAppointmentDate(newDate)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  disablePast
                  views={['year', 'month', 'day']}
                />
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
              
          
            <Autocomplete
              options={petCages}
              getOptionLabel={(cage) => `${cage.pet_cage_id} ${cage.note || ''} ${cage.status_cage || ''}`.trim()}
              onChange={(event, value) => setSelectedCage(value ? value.pet_cage_id : '')}
              renderInput={(params) => (
            <TextField {...params} label="กรงฝากเลี้ยง" variant="outlined" fullWidth />
            )}
            renderOption={(props, cage) => (
              <li {...props}>
                {`${cage.pet_cage_id} ${cage.note || ''} `}
                <span style={{
                  backgroundColor: cage.status_cage === 'เต็ม' ? '#ffcccc' : '#ccffcc', // สีพื้นหลัง
                  padding: '2px 4px', // การเว้นระยะ
                  borderRadius: '4px', // มุมมน
                  marginLeft: '10px'
                }}>
                  {cage.status_cage}
                </span>
              </li>
            )}
          />
            <Autocomplete
              options={personnelList}
              getOptionLabel={(personnel) => personnel ? `${personnel.first_name} ${personnel.last_name} (${personnel.role}) ` : ''}
              onChange={(event, value) => setSelectedPersonnel(value || null)}
              value={selectedPersonnel ? personnelList.find(p => p.personnel_id === selectedPersonnel.personnel_id) : null}
              renderInput={(params) => (
            <TextField {...params} label="ผู้บันทึก" variant="outlined" fullWidth />
            )}
          />
            </>
          ) : ( 
            <DatePicker
              label="เลือกวันที่"
              value={appointmentDate}
              onChange={(newDate) => setAppointmentDate(newDate)}
              renderInput={(params) => <TextField {...params} fullWidth />}
              disablePast
              views={['year', 'month', 'day']}
            />
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
          </>
        )}

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
          <Button variant="contained" color="primary" onClick={createAppointment}>
            บันทึกการนัดหมาย
          </Button>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default AddAppointment