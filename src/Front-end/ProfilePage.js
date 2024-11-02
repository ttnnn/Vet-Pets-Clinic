import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Avatar, Divider, Tab, Tabs,IconButton, Button  } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/th'; // Thai localization
import Sidebar from './Sidebar';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PetDialog from './component/Addnewpets';

const PetProfilePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pet, owner } = location.state; // pet and owner data from route state
  const [age, setAge] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [open, setOpen] = useState(false);

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
          <Box>
            <Avatar
              alt={pet.pet_name}
              src={`http://localhost:8080${pet.ImageUrl}`}
              sx={{ width: 180, height: 180 }}
              variant="rounded"
            />
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
              <button onClick={() => setOpen(true)} > แก้ไข </button>
            </Card>
    
            
            <PetDialog
                open={open}
                handleClose={() => setOpen(false)}
                selectedOwnerId={owner.owner_id}  // Renamed prop to ownerId
                petId={pet.pet_id} 
                petData={pet} 
                isEditMode={true}
            />
            {/* Owner Information Block */}
            <Card sx={{ flex: 1 }}>
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
             <button> แก้ไข </button>
             
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
            <Tab label="ประวัติการรักษา" />
            <Tab label="บันทึกการรักษา" />
            <Tab label="ประวัติการรับวัคซีน" />
          </Tabs>
        </Box>
      </Box>
    </Box>
  );
};

export default PetProfilePage;
