import React, { useState } from 'react';
import { Tab, Tabs, TextField, Autocomplete } from '@mui/material'; 
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers'; // Keep only this import

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

const BoardingFeature = ({ petCages, personnelList, selectedPetId, pets, setSelectedCage, setSelectedPersonnel }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState(null);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
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
        InputProps={{ readOnly: true }}
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
              backgroundColor: cage.status_cage === 'เต็ม' ? '#ffcccc' : '#ccffcc',
              padding: '2px 4px',
              borderRadius: '4px',
              marginLeft: '10px'
            }}>
              {cage.status_cage}
            </span>
          </li>
        )}
      />

      <Autocomplete
        options={personnelList}
        getOptionLabel={(personnel) => personnel ? `${personnel.first_name} ${personnel.last_name}` : ''}
        onChange={(event, value) => setSelectedPersonnel(value || null)}
        renderInput={(params) => (
          <TextField {...params} label="ผู้บันทึก" variant="outlined" fullWidth />
        )}
      />
    </Box>
  );
};

export default BoardingFeature;
