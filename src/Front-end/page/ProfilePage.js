import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Avatar, Divider, Tab, Tabs,IconButton, Button ,Snackbar ,Dialog,DialogTitle, DialogContent, DialogActions} from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/th'; // Thai localization
import Sidebar from './Sidebar';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditPetDialog from '../component/EditPetDialog';
import EditOwnerDialog from '../component/EditOwnerDialog';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DiagnosisForm from '../component/Diagnosisform';
import TableHistory from '../component/Tablehistory';



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
  const [selectedImage, setSelectedImage] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  console.log("Owner state before rendering:", owner);

  
  console.log('Location state:', location.state);

  //ดึงข้อมูลทั้งหมดจาก API และอัปเดตสถานะ (state) ของ pet และ owner
  
  const fetchPetAndOwnerDetails = async (petId, ownerId) => {
    try {
      const [petResponse, ownerResponse] = await Promise.all([
        axios.get(`${api}/pets/${petId}`),
        axios.get(`${api}/owners/${ownerId}`)
      ]);
  
      if (petResponse.status === 200) {
        setPet(petResponse.data);
        console.log('Pet Data:', petResponse.data);
        // calculateAge(petResponse.data.pet_birthday);
      }
      if (ownerResponse.status === 200) {
        setOwner(ownerResponse.data);
        console.log('Owner Data:', ownerResponse.data);
      }
    } catch (error) {
      console.error('Error fetching pet or owner details:', error);
    }
  };

  useEffect(() => {
    if (!location.state) {
      console.error('Location state is missing. Ensure the previous page sends petId and ownerId.');
      return;
    }
  
    const { pet, owner } = location.state; // ดึงค่า pet และ owner จาก location.state
    const petId = pet?.petId;
    const ownerId = owner?.ownerId;
  
    if (petId && ownerId) {
      fetchPetAndOwnerDetails(petId, ownerId);
    } else {
      console.error('petId or ownerId is missing in location state:', location.state);
    }
  }, [location.state]);
  
  

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
    updateAppointments();
  };
 
  const handleBack =()=>{
    navigate('/register', { state: { locationOwnerID: owner.owner_id, locationActiveTab: 1 } });
  }

  
  const spayedNeuteredStatus = pet.spayed_neutered === false ? "ไม่ได้ทำหมัน" : "ทำหมัน";
  const formatDate = (dateString) => dayjs(dateString).locale('th').format('D MMMM YYYY');

  const updateAppointments = async () => {
    try {
      const appointmentsResponse = await axios.get(`${api}/appointment`);
      setAppointments(appointmentsResponse.data);
    } catch (error) {
      console.error('Error fetching updated appointments:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };
  // Handle file selection
  const handleImageSave = async () => {
    if (!selectedImage) return; // Ensure an image is selected
  
    const formData = new FormData();
    formData.append('image', selectedImage);
  
    try {
      const response = await axios.put(`${api}/pets/${pet.pet_id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
  
      if (response.status === 200) {
        setSnackbarOpen(true); // Notify success
        const updatedPetData = response.data;
        setPet((prevPet) => ({
          ...prevPet,
          image_url: updatedPetData.image_url, // Update image URL
        }));
        setEditImageOpen(false); // Close the dialog
        setSelectedImage(null); // Reset the temp state.
        
        await fetchUpdatedPetData();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };
  const fetchUpdatedPetData = async () => {
    try {
      const response = await axios.get(`${api}/pets/${pet.pet_id}`);
      if (response.status === 200) {
        setPet(response.data); // Update pet data in state
      }
    } catch (error) {
      console.error('Error fetching updated pet data:', error);
    }
  };

// Update handler
const handleUpdate = async (updatedData, type) => {
  console.log(updatedData) 
  const endpoint = type === 'pet' ? `/pets/${pet.pet_id}` : `/owners/${owner.owner_id}`;

  try {
    const response = await axios.put(`${api}${endpoint}`, updatedData, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 200) {
      setSnackbarOpen(true);
      // Update state with new data
      const updatedResponse = await axios.get(`${api}${endpoint}`);
      if (type === 'pet') {
        setPet(updatedResponse.data);  // Update pet state with new data
      } else {
        setOwner(updatedResponse.data); // Update owner state with new data
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
  const tabToTypeServiceMap = {
    2: 'ตรวจรักษา', // "ประวัติการรักษา"
    3: 'วัคซีน', // "ประวัติการรับวัคซีน"
    4: 'อาบน้ำ-ตัดขน', // "ประวัติการอาบน้ำตัดขน"
    5: 'ฝากเลี้ยง', // "ประวัติการฝากเลี้ยง"
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
          <Box
            sx={{
              mr:2,
              borderRadius: '8px', // กรอบมน
              overflow: 'hidden', // ป้องกันรูปภาพล้นกรอบ
              width: 300, // กำหนดความกว้างของกรอบ
              height: 365, // กำหนดความสูงของกรอบ
            
            }}
          >
            <Avatar
              alt={pet.pet_name}
              src={`http://localhost:8080${pet.image_url}`}
              sx={{ width: '100%', // ให้รูปขยายเต็มกรอบ
                height: '100%', // ให้รูปสูงเต็มกรอบ
                objectFit: 'cover', // ปรับให้เต็มกรอบโดยไม่บิดเบี้ยว
                borderRadius: '8px', }}
              variant="rounded"
              
            />
            </Box>
            <IconButton
            onClick={() => setEditImageOpen(true)}
            sx={{
              position: 'absolute',
              bottom: 2,
              right: 18,
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
                <Typography variant="body1">MicrochipNumber: {pet.microchip_number}</Typography>
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
        {/* {tabContent[activeTab]} */}

        {activeTab === 0 &&
         <DiagnosisForm 
           petId={pet.pet_id}
          //  appointmentId={appointment_id} 
        />}
         {activeTab >= 2 && (
         <TableHistory
          appointments={appointments}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTabLabel={tabToTypeServiceMap[activeTab]} // Pass the corresponding type_service
          selectedPetId={pet.pet_id}
        />
      )}


        <EditPetDialog open={editPetOpen} onClose={() => setEditPetOpen(false)} pet={pet} onSave={(data) => handleUpdate(data, 'pet')} />
        <EditOwnerDialog open={editOwnerOpen} onClose={() => setEditOwnerOpen(false)} owner={owner} onSave={(data) => handleUpdate(data, 'owner')} />

        <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleCloseSnackbar} message="Data updated successfully!" />
        <Dialog open={editImageOpen} onClose={() => setEditImageOpen(false)}>
                  <DialogTitle>อัปโหลดรูปภาพสัตว์เลี้ยง</DialogTitle>
                  <DialogContent>
                      <input 
                          type="file" 
                          accept="image/*" 
                           onChange={handleFileChange}
                      />
                  </DialogContent>
                  <DialogActions>
                      <Button onClick={() => setEditImageOpen(false)}>ยกเลิก</Button>
                      <Button onClick={handleImageSave}    disabled={!selectedImage} color="primary">บันทึก</Button>
                  </DialogActions>
              </Dialog>
      </Box>
    </Box>
  );
};

export default PetProfilePage;