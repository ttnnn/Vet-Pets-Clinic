import React, { useEffect, useState } from 'react';
import { Box, TextField, Typography, AppBar, Toolbar, IconButton, Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const api = 'http://localhost:8080/api/customer';

const PetsDetail = () => {
  const navigate = useNavigate();
   const location = useLocation();
  const [pet, setPet] = useState([]);
  const { petId } = location.state;

  console.log('petId', location.state)
  console.log('pet',pet)


  const fetchPetDetail = async () => {
    try {
      const response = await axios.get(`${api}/pets/${petId}`);
      if ( response.data) {
        console.log('setPet', response.data);
        setPet(response.data);
      }
    } catch (error) {
      console.error('Error fetching pet details:', error.message);
    }
  };

  
  useEffect(() => {
    fetchPetDetail();
  }, [petId]);

  const handleBackToPets = () => {
    navigate('/customer/pets');
  };

  if (!pet) {
    return <Typography variant="h6">กำลังโหลดข้อมูลสัตว์เลี้ยง...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleBackToPets}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            รายละเอียดสัตว์เลี้ยง
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{  paddingTop: '80px', mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="ชื่อสัตว์เลี้ยง"
          value={pet.pet_name || '-'}
          fullWidth
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="ประเภทสัตว์เลี้ยง"
          value={pet.pet_species || '-'}
          fullWidth
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="พันธุ์สัตว์เลี้ยง"
          value={pet.pet_breed || '-'}
          fullWidth
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="สี/ตำหนิ"
          value={pet.pet_color || '-'}
          fullWidth
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="เคยทำหมัน"
          value={pet.spayed_neutered ? 'ใช่' : 'ไม่'}
          fullWidth
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="วันเกิด"
          value={pet.pet_birthday || '-'}
          fullWidth
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="เพศ"
          value={pet.pet_gender === 'male' ? '♂ ชาย' : '♀ หญิง'}
          fullWidth
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="หมายเลขไมโครชิพ"
          value={pet.microchip_number || '-'}
          fullWidth
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="ประวัติการฉีดวัคซีน"
          value={pet.vaccinationHistory || '-'}
          multiline
          rows={4}
          fullWidth
          InputProps={{ readOnly: true }}
        />
      </Box>
    </Box>
  );
};

export default PetsDetail;
