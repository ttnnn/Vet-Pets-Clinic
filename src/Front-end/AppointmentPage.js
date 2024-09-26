import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Tabs, Tab, MenuItem, Select, FormControl, InputLabel, TextField, Autocomplete} from '@mui/material';
import Sidebar from './Sidebar';
import axios from 'axios';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import TimeSlotPicker from './component/TimeSlot';
import TableAppointments from './component/TableAppointment';
import { styled } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import CheckIcon from '@mui/icons-material/Check';


const api = 'http://localhost:8080';

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

const categories = ['ทั้งหมด', 'อาบน้ำ-ตัดขน', 'ตรวจรักษา', 'ฝากเลี้ยง', 'วัคซีน'];


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
  const [alertMessage, setAlertMessage] = useState(''); // State to store alert message
  const [alertSeverity, setAlertSeverity] = useState('success'); // State to store alert severity (success, error)

  // Fetch all owners on initial load
  useEffect(() => {
    axios.get(`${api}/owners`)
      .then(response => setOwners(response.data))
      .catch(error => console.error('Error fetching owners:', error));
  }, []);

  // Fetch owners based on search input
  useEffect(() => {
    if (searchOwner.length > 0) {
      axios.get(`${api}/owners?search=${searchOwner} `)
        .then(response => 
        setOwners(response.data))
        .catch(error => console.error('Error fetching owners:', error));
    }else {
      // Fetch all owners when searchOwner is empty
      axios.get(`${api}/owners`)
        .then(response => {
          setOwners(response.data);
          setPets([]); // Optionally reset pets when showing all owners
        })
        .catch(error => console.error('Error fetching all owners:', error));
    }
    
  }, [searchOwner]);

  // Fetch pets based on selected owner
  useEffect(() => {
    if (selectedOwnerId) {
      axios.get(`${api}/pets?OwnerId=${selectedOwnerId}`)
        .then(response =>{
          setPets(response.data);
          setSelectedPetId('')
        })
        .catch(error => console.error('Error fetching pets:', error));
    } else {
      setPets([]);
      setSelectedPetId('')
    }
  }, [selectedOwnerId]);



  const createAppointment = async () => {
    try {
    // console.log("Selected Owner ID:", selectedOwnerId);
    // console.log("Selected Pet ID:", selectedPetId);
    // console.log("Type Service:", TypeService);
    // console.log("Appointment Date:", appointmentDate);
    // console.log("Appointment Time:", appointmentTime);
    // console.log("Reason:", reason);

      let appointmentData = {
        OwnerId: selectedOwnerId,
        PetId: selectedPetId,
        TypeService,
        Status: 'Approved'
        
      };
  
      // If TypeService is not 'ฝากเลี้ยง', include AppointmentDate, AppointmentTime, and Reason
      if (TypeService !== 'ฝากเลี้ยง') {
        const formattedDate = appointmentDate ? appointmentDate.toLocaleDateString('en-TH').split('T')[0] : null;
        const formattedTime = appointmentTime ? (() => {
          const [startTime] = appointmentTime.split(' - ');
          const [hours, minutes] = startTime.split(':');
          return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
        })() : null;
        console.log("Formatted Date:", formattedDate);
       console.log("Formatted Time:", formattedTime);
      
  
        appointmentData = {
          ...appointmentData,
          AppointmentDate: formattedDate,
          AppointmentTime: formattedTime,
          Reason: reason || null
        };
      }
      
  
      // Create appointment
      const appointmentResponse = await axios.post(`${api}/create-appointment`, appointmentData);
      const newAppointmentID = appointmentResponse.data.AppointmentID;
      console.log("Appointment response:", appointmentResponse.data);
  
      // If TypeService is 'ฝากเลี้ยง', create PetHotel entry
      if (TypeService === 'ฝากเลี้ยง') {
        await createPetHotelEntry(newAppointmentID);
      }
      setAlertSeverity('success');
      setAlertMessage('เพิ่มการนัดหมายสำเร็จ.');
      resetForm();
      setTimeout(() => {
        setAlertMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error creating appointment:', error);
      setAlertSeverity('error');
      setAlertMessage('กรุณาตรวจสอบการนัดหมายใหม่.');

      setTimeout(() => {
        setAlertMessage('');
      }, 1000);
    }
  };
  const resetForm = () => {
    setSelectedOwnerId('');
    setSelectedPetId('');
    setTypeService('');
    setAppointmentDate(null);
    setAppointmentTime(null);
    setReason('');
    setCheckInDate(null);
    setCheckOutDate(null);
  };
  
  // Function to create a PetHotel entry
  const createPetHotelEntry = async (appointmentID) => {
    try {
      const numDays = checkInDate && checkOutDate ? Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) : 0;
      const petHotelData = {
        AppointmentID: appointmentID,
        PetId: selectedPetId,
        EntryDate: checkInDate ? checkInDate.toLocaleDateString('en-TH').split('T')[0] : '',
        ExitDate: checkOutDate ? checkOutDate.toLocaleDateString('en-TH').split('T')[0] : '',
        NumDay: numDays,
        Status: '', // Set status as needed
      };

  
      // Create PetHotel entry
      const responseHotel = await axios.post(`${api}/create-pet-hotel`, petHotelData);
      console.log("PetHotel response:", responseHotel.data);
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
            getOptionLabel={(owner) => `${owner.FirstName} ${owner.LastName}`}
            onChange={(event, value) => setSelectedOwnerId(value ? value.OwnerID : '')}
            value={selectedOwnerId ? owners.find(owner => owner.OwnerID === selectedOwnerId) : null}
            renderInput={(params) => 
              <TextField {...params} 
                label="Select Owner" 
                variant="outlined" 
                fullWidth
                onChange={(e) => setSearchOwner(e.target.value)} />}
          />
          <Autocomplete
            options={pets}
            getOptionLabel={(pet) => pet.PetName}
            onChange={(event, value) => setSelectedPetId(value ? value.PetID : '')}
            value={selectedPetId ? pets.find(pet => pet.PetID === selectedPetId) : null}
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


          <TimeSlotPicker 
          TypeService={TypeService} // Pass the selected service type
          selectedDate={appointmentDate}
          onTimeSelect={setAppointmentTime} // Pass the function to handle time selection
        />
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

const AppointmentPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [appointments,setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        
        const appointmentsResponse = await axios.get(`${api}/appointment`);
        const petHotelResponse = await axios.get(`${api}/pethotel`); // Fetch PetHotel data

        const updatedAppointments = appointmentsResponse.data.map((appointment) => {
          if (appointment.TypeService === 'ฝากเลี้ยง') {
            const relatedPetHotel = petHotelResponse.data.find(
              (petshotel) => petshotel.AppointmentID === appointment.AppointmentID
            );
            if (relatedPetHotel) {
              return { ...appointment, AppointmentDate: relatedPetHotel.EntryDate };
            }
          }
          return appointment;
        });

        setAppointments(updatedAppointments);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  

  return (
    <Box display="flex" height="100vh">
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>ระบบจัดการนัดหมาย</Typography>
          <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          indicatorColor="secondary"
          textColor="inherit"
          variant="fullWidth"
          aria-label="full width tabs example"
          >
            <StyledTab label="นัดหมายใหม่(รออนุมัติ)" />
            <StyledTab label="สมุดนัดหมาย" />
            <StyledTab label="เพิ่มการนัดหมาย" />
          </Tabs>
          
          {activeTab === 0 && (
            <TableAppointments
              appointments={appointments.filter(appt => appt.Status === 'waiting')}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setAppointments={setAppointments}
              statusFilter="Approved"
            />
          )}
          {activeTab === 1 && (
            <TableAppointments
              appointments={appointments.filter(appt => appt.Status === 'Approved')}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setAppointments={setAppointments}
              statusFilter="waiting"
            />
          )}
          {activeTab === 2 && <AddAppointment />}
        </Paper>
      </Box>
    </Box>
  );
};

export default AppointmentPage;