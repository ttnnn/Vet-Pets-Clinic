import React, { useEffect, useState } from 'react';
import { 
  Box, TextField, Typography, AppBar, Toolbar, IconButton, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';


const api = 'http://localhost:8080/api/customer';

const PetsDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pet, setPet] = useState([]);
  const { petId } = location.state;
  const [editImageOpen, setEditImageOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const fetchPetDetail = async () => {
    try {
      const response = await axios.get(`${api}/pets/${petId}`);
      if (response.data) {
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleImageSave = async () => {
    if (!selectedImage) return;

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await axios.put(`${api}/pets/${pet.pet_id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        setSnackbarOpen(true);
        setPet((prevPet) => ({
          ...prevPet,
          image_url: response.data.image_url,
        }));
        setEditImageOpen(false);
        setSelectedImage(null);
        fetchPetDetail(); // Re-fetch pet data
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
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
          <Typography variant="h6" sx={{ flexGrow: 1 ,textAlign: 'center' }}>
            โปรไฟล์สัตว์เลี้ยง
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          marginBottom: 3, // เพิ่มระยะห่างด้านล่าง
          paddingTop: '50px',
          gap: 2 
        }}
      >
        {/* แสดงรูปภาพพร้อมปุ่มแก้ไข */}
        {pet.image_url && (
          <Box
            sx={{
              position: 'relative', // ตั้งค่า position
              width: 120,
              height: 120,
              marginBottom: 2,
            }}
          >
            <img
              src={`http://localhost:8080${pet.image_url}`}
              alt={pet.pet_name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%',
              }}
            />
            {/* ปุ่มไอคอนแก้ไข */}
            <IconButton
              onClick={() => setEditImageOpen(true)}
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: '#ffffff',
                color: '#000',
                '&:hover': { backgroundColor: '#e0e0e0' },
                border: '1px solid #ccc',
              }}
            >
              <EditIcon />
            </IconButton>
          </Box>
        )}

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
          value={pet.pet_birthday ? new Date(pet.pet_birthday).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
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

      <Dialog 
        open={editImageOpen} 
        onClose={() => setEditImageOpen(false)} 
        aria-labelledby="edit-image-dialog-title" // เพิ่ม aria-labelledby เพื่อช่วยเทคโนโลยีช่วยเหลือ
        aria-describedby="edit-image-dialog-description" // เพิ่มคำอธิบาย
      >
        <DialogTitle id="edit-image-dialog-title">อัปโหลดรูปภาพสัตว์เลี้ยง</DialogTitle>
        <DialogContent>
          <Typography id="edit-image-dialog-description" sx={{ mb: 2 }}>
            เลือกไฟล์รูปภาพใหม่เพื่ออัปโหลด
          </Typography>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditImageOpen(false)}>ยกเลิก</Button>
          <Button onClick={handleImageSave} disabled={!selectedImage} color="primary">
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default PetsDetail;
