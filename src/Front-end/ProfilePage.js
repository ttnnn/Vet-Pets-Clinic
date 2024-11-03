import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Avatar, Divider, Tab, Tabs,IconButton, Button ,Snackbar ,Dialog,DialogTitle, DialogContent, DialogActions} from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/th'; // Thai localization
import Sidebar from './Sidebar';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditPetDialog from './component/EditPetDialog';
import EditOwnerDialog from './component/EditOwnerDialog';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DiagnosisForm from './component/Diagnosisform';



const api = 'http://localhost:8080'
const PetProfilePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // const { pet, owner } = location.state; // pet and owner data from route state
  const { pet: initialPet, owner: initialOwner } = location.state; // Get initial data from route state
  const [pet, setPet] = useState(initialPet);
  const [owner, setOwner] = useState(initialOwner);
  const [age, setAge] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [editPetOpen, setEditPetOpen] = useState(false);
  const [editOwnerOpen, setEditOwnerOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [editImageOpen, setEditImageOpen] = useState(false);


  console.log("ownerId",owner.owner_id);
  useEffect(() => {
    calculateAge(pet.pet_birthday); // Calculate pet's age on load
  }, [pet.pet_birthday]);

  const calculateAge = (date) => {
    if (!date) return;

    const today = dayjs();
    const birthDay = dayjs(date);
    const years = today.diff(birthDay, 'year');
    const months = today.diff(birthDay.add(years, 'year'), 'month');
    const days = today.diff(birthDay.add(years, 'year').add(months, 'month'), 'day');

    setAge({ years, months, days });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
 
  const handleBack =()=>{
    navigate('/register')
  }
  const spayedNeuteredStatus = pet.SpayedNeutered === 0 ? "ไม่ได้ทำหมัน" : "ทำหมัน";
  const formatDate = (dateString) => dayjs(dateString).locale('th').format('D MMMM YYYY');

  
  
  const handleImageUpload = async (newImage) => {
    const formData = new FormData();
    formData.append('image', newImage);

    try {
        const response = await axios.put(`${api}/pets/${pet.pet_id}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.status === 200) {
            setSnackbarOpen(true);
            const updatedPetData = response.data;
            setPet((prevPet) => ({
                ...prevPet,
                imageUrl: updatedPetData.imageUrl, // Update the image URL
            }));
        }
    } catch (error) {
        console.error('Error uploading image:', error);
    }
};
// Update handler
const handleUpdate = async (updatedData, type) => {
  const endpoint = type === 'pet' ? `/pets/${pet.pet_id}` : `/owners/${owner.owner_id}`;

  try {
    const response = await axios.put(`${api}${endpoint}`, updatedData, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 200) {
      setSnackbarOpen(true);
      // Update state with new data
      if (type === 'pet') {
        setPet({ ...pet, ...updatedData }); // Update pet state with new data
      } else {
        setOwner({ ...owner, ...updatedData }); // Update owner state with new data
      }
    } else {
      console.error('Failed to update data', response.data);
    }
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
};

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />

      {/* Main Content Area with Gray Background */}
      <Box sx={{ flexGrow: 1, padding: 3, backgroundColor: '#f5f5f5' }}>
        {/* Header */}
        <Box sx={{ backgroundColor: 'white', padding: 2, borderRadius: 1, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" gutterBottom>โปรไฟล์</Typography>
            <IconButton onClick={handleBack} sx={{ ml: 2 }}>
                <ArrowForwardIcon />
            </IconButton>
        </Box>


        {/* Profile Content Section */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Profile Picture */}
          <Box sx={{ position: 'relative' }}>
            <Avatar
              alt={pet.pet_name}
              src={`http://localhost:8080${pet.ImageUrl}`}
              sx={{ width: 250, height: 335 }}
              variant="rounded"
            />
            <IconButton
            onClick={() => setEditImageOpen(true)}
            sx={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              backgroundColor: '#f0f0f0', 
              color: 'black', 
              '&:hover': {
                backgroundColor: '#e0e0e0', 
              },
              width: 40, 
              height: 40, 
              borderRadius: '10%', 
            }}
          >
            <EditIcon />
          </IconButton>
          </Box>

          {/* Profile Info Container */}
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexGrow: 1 }}>
            {/* Pet Information Block */}
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>ข้อมูลสัตว์เลี้ยง</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1">ชื่อสัตว์เลี้ยง: {pet.pet_name}</Typography>
                <Typography variant="body1">เพศ: {pet.pet_gender}</Typography>
                <Typography variant="body1">ประเภท: {pet.pet_species}</Typography>
                <Typography variant="body1">สี/ตำหนิ: {pet.pet_color}</Typography>
                <Typography variant="body1">พันธุ์: {pet.pet_breed}</Typography>
                <Typography variant="body1">ข้อมูลอื่นๆ: {spayedNeuteredStatus}</Typography>
                <Typography variant="body1">วันเกิด: {formatDate(pet.pet_birthday)}</Typography>
                <Typography variant="body1">อายุ: {age.years} ปี {age.months} เดือน {age.days} วัน</Typography>
              </CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: 1 }}>
                 <IconButton onClick={() => setEditPetOpen(true)}><EditIcon/></IconButton>
             </Box>
            </Card>
    
            
            {/* Owner Information Block */}
            <Card sx={{ flex: 1 ,position: 'relative' }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>ข้อมูลเจ้าของ</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1">
                  ชื่อเจ้าของ: {owner.first_name} {owner.last_name}
                </Typography>
                <Typography variant="body1">เบอร์ติดต่อ: {owner.phone_number}</Typography>
                <Typography variant="body1">เบอร์ติดต่อฉุกเฉิน: {owner.phone_emergency}</Typography>
                <Typography variant="body1">
                  ที่อยู่: {owner.address} {owner.province} {owner.postal_code}
                </Typography>
              </CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', position: 'absolute', bottom: 8, right: 8 }}>
                 <IconButton onClick={() => setEditOwnerOpen(true)}><EditIcon/></IconButton>
             </Box>
            </Card>
          </Box>
        </Box>

        {/* Tabs Section at the Bottom */}
        <Box sx={{ backgroundColor: 'white', padding: 2, borderRadius: 1, mt: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="แก้ไขประวัติการรักษา" />
            <Tab label="บันทึกการรักษา" />
            <Tab label="ประวัติการรักษา" />
            <Tab label="ประวัติการรับวัคซีน" />
            <Tab label="ประวัติการอาบน้ำตัดขน" />
            <Tab label="ประวัติการฝากเลี้ยง" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <DiagnosisForm></DiagnosisForm>
        ) 
          
        }
        <EditPetDialog open={editPetOpen} onClose={() => setEditPetOpen(false)} pet={pet} onSave={(data) => handleUpdate(data, 'pet')} />
        <EditOwnerDialog open={editOwnerOpen} onClose={() => setEditOwnerOpen(false)} owner={owner} onSave={(data) => handleUpdate(data, 'owner')} />

        <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleCloseSnackbar} message="Data updated successfully!" />
        <Dialog open={editImageOpen} onClose={() => setEditImageOpen(false)}>
                  <DialogTitle>อัปโหลดรูปภาพสัตว์เลี้ยง</DialogTitle>
                  <DialogContent>
                      <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageUpload(e.target.files[0])} 
                      />
                  </DialogContent>
                  <DialogActions>
                      <Button onClick={() => setEditImageOpen(false)}>ยกเลิก</Button>
                      <Button onClick={() => setEditImageOpen(false)}>บันทึก</Button>
                  </DialogActions>
              </Dialog>
      </Box>
    </Box>
  );
};

export default PetProfilePage;
