import React, { useEffect, useState ,useCallback } from 'react';
import { 
  Box, TextField, Typography, AppBar, Toolbar, IconButton, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions ,Snackbar
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CircularProgress from '@mui/material/CircularProgress';
import { customerAPI  } from "../../utils/api";
import NotificationCustomer from './NotificationCustomer';

const PetsDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pet, setPet] = useState([]);
  const { petId } = location.state;
  const [editImageOpen, setEditImageOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  const fetchPetDetail = useCallback(async () => {
    try {
      const petResponse = await customerAPI.get(`/pets/${petId}`);
      if (petResponse.data) {
        let updatedPetData = { ...petResponse.data };
        try {
          const historyResponse = await customerAPI.get(`/history/vaccien/${petId}`);
          if (historyResponse.data?.length > 0) {
            updatedPetData.vaccineHistory = historyResponse.data;
          }
        } catch (historyError) {
          console.warn("No vaccine history found or API error:", historyError.message);
        }
        setPet(updatedPetData);
      }
    } catch (error) {
      console.error("Error fetching pet details:", error.message);
    }
  }, [petId]); 
  
 
  useEffect(() => {
    fetchPetDetail();
  }, [fetchPetDetail]);
  

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
    if (!selectedImage) {
      alert('กรุณาเลือกรูปภาพก่อนบันทึก');
      return;
    }
    
    const formData = new FormData();
    formData.append('image', selectedImage);
    
    try {
      setLoading(true); // เริ่มโหลด
      const response = await customerAPI.put(`/pets/${pet.pet_id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    
      if (response.status === 200) {
        const updatedPetData = response.data;
    
        // อัปเดตข้อมูลใน State
        setPet((prevPet) => ({
          ...prevPet,
          image_url: updatedPetData.image_url,
        }));
    
        setSnackbarMessage('อัปโหลดรูปภาพสำเร็จ');
        setSnackbarOpen(true);
    
        setEditImageOpen(false); // ปิด Dialog
        setSelectedImage(null); // รีเซ็ต temp state
        await fetchPetDetail(); // (Optional) อัปเดตข้อมูลจาก API
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ กรุณาลองอีกครั้ง');
    } finally {
      setLoading(false); // โหลดเสร็จ
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
      <NotificationCustomer />
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
        <Box
         sx={{
          position: 'relative', // ตั้งค่า position
          width: 120,
          height: 120,
          marginBottom: 2,
          borderRadius: '50%', // ทำให้เป็นวงกลม
          backgroundColor: pet.image_url ? 'transparent' : '#dcdcdc', // ถ้ามีรูปจะเป็นโปร่งใส, ถ้าไม่มีจะเป็นสีเทาทึบ
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        >
        {/* แสดงรูปภาพหรือ default */}
        <Box
          sx={{
            position: 'relative', // ตั้งค่า position
            width: 120,
            height: 120,
            marginBottom: 2,
          }}
        >
          <img
          src={
            pet.image_url
              ? pet.image_url // ใช้ URL จากฐานข้อมูล
              : '/default-image.png' // ใช้ภาพ Default หากไม่มีรูป
          }
            alt={pet.pet_name }
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
            }}
          />

          {/* ปุ่มไอคอนเพิ่มหรือแก้ไข */}
          <IconButton
            onClick={() => setEditImageOpen(true)} // เปิด dialog สำหรับเพิ่มหรือแก้ไขรูป
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
            {pet.image_url ? <EditIcon /> : <AddPhotoAlternateIcon />} {/* แสดงไอคอนแก้ไขหรือเพิ่ม */}
          </IconButton>
        </Box>
      </Box>
          


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
          value={pet.vaccineHistory?.map(vaccine => vaccine.category_name).join(', ') || '-'}
          multiline
          rows={4}
          fullWidth
          InputProps={{ readOnly: true }}
        />

      </Box>
      
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleCloseSnackbar}  message={snackbarMessage} />
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
           {loading && (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            minHeight="100px" // สามารถปรับความสูงตามต้องการ
          >
            <CircularProgress />
          </Box>
        )}
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
