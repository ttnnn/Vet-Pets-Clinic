import React, { useState , useEffect} from 'react';
import { Button, TextField, Typography, Box, Paper, Tabs, Tab, 
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton, ToggleButtonGroup, 
    ToggleButton, MenuItem, Autocomplete, Snackbar
 } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Sidebar from './Sidebar';
import { styled } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import Alert from '@mui/material/Alert';
import RegisterSearch from '../component/RegisterSearch';
import { DogBreed, CatBreed } from '../component/Breeds';
import dayjs from 'dayjs';
import 'dayjs/locale/th';  // นำเข้า locale ภาษาไทย

import { useLocation } from 'react-router-dom';
import { clinicAPI } from "../../utils/api";
dayjs.locale('th'); // ตั้งค่าให้ dayjs ใช้ภาษาไทย


const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  minWidth: 0,
  marginRight: theme.spacing(2),
  fontWeight: theme.typography.fontWeightRegular,
  fontSize: 18,
  '&:hover': {
    color: theme.palette.primary.main,
    opacity: 1,
  },
  '&.Mui-selected': {
    color: 'black', // Change the text color for the selected tab
    backgroundColor: '#b3e5fc', // Optional: background color when selected
    fontWeight: theme.typography.fontWeightMedium,
  },
  '&.Mui-focusVisible': {
    backgroundColor: 'rgba(100, 95, 228, 0.32)',
  },
}));

const RegisterPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [gender, setGender] = useState('male');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState(null);
  const [age, setAge] = useState('');
  const [firstNameOwner , setFirstName] = useState('');
  const [lastNameOwner , setLastNameOwner] = useState('');
  const [phoneEmergency , setPhoneEmergency] = useState('');
  const [address , setAddress] = useState('')
  const [province , setProvince] = useState('')
  const [postalCode , setPostalCode] = useState('')
  const [petName , setPetName] = useState('')
  const [petColor , setPetColor] = useState('')
  const [petSpecies ,setPetSpecies] = useState('')
  const [petBreed , setPetBreed] = useState('')
  const [petSpayed ,setPetSpayed] = useState(false)
  const [petMicrochip , setMicrochip] = useState('')
  const [pets, setPets] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const[otherPetSpecies,setOtherPetSpecies] = useState('')
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);  // สำหรับเปิด/ปิด Dialog
  const [selectedPetIndex, setSelectedPetIndex] = useState(null);  // เก็บ index ของสัตว์เลี้ยงที่จะลบ
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  const location = useLocation();
  const { locationActiveTab } = location.state || {};

  // console.log("locationActiveTab : ",locationActiveTab)

  useEffect(() => {
    if (locationActiveTab !== undefined) {
      setActiveTab(locationActiveTab);
    }
  }, [locationActiveTab]);
  
 

  const handleSnackbarOpen = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
    
  const handleSavePet = () => {
    
    if (!petName || !petColor || !petBreed || !gender || !birthDate || !petSpecies) {
      handleSnackbarOpen('กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึก!', 'error');
      return;
    }

    const petData = {
      pet_name: petName,
      pet_color: petColor,
      pet_breed: petBreed || '',
      pet_gender: gender,
      pet_birthday: birthDate ? dayjs(birthDate).format('YYYY-MM-DD') : '',
      spayed_neutered: petSpayed ,
      microchip_number: petMicrochip,
      pet_species: petSpecies === "อื่นๆ" ? otherPetSpecies : petSpecies,
    };
  //ตอนเช็ควนลูปแก้ไขข้อมูลสัตว์เลี้ยงแต่ละตัว
    if (editIndex !== null) {
      setPets((prevPets) => prevPets.map((pet, i) => (i === editIndex ? petData : pet)));
    } else {
      setPets((prevPets) => [...prevPets, petData]);
    }
    setOpen(false);
    clearPetForm();
    setEditIndex(null);
  };
  


  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleClickOpen = (pet, index) => {
    setPetName(pet.pet_name);
    setPetColor(pet.pet_color);
    setPetBreed(pet.pet_breed);
    setGender(pet.pet_gender);
    setBirthDate(pet.pet_birthday ? dayjs(pet.pet_birthday).toDate() : null);
    setAge({ years: age.years, months: age.months, days: age.days }); // แก้ไขได้ถ้าคำนวณอายุในรูปแบบนี้
    setPetSpayed(pet.spayed_neutered);
    setMicrochip(pet.microchip_number);
    setPetSpecies(pet.pet_species);
    setEditIndex(index); // เก็บ index ของสัตว์เลี้ยงที่จะแก้ไข
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
    clearPetForm()
    setEditIndex(null);
  };

 
 

  // ฟังก์ชันเปิด Dialog ยืนยันการลบ
  const handleOpenDeleteDialog = (index) => {
    setSelectedPetIndex(index); // ตั้งค่า index ที่ต้องการลบ
    setOpenDeleteDialog(true);  // เปิด Dialog
  };

    // ฟังก์ชันยืนยันการลบ
  const handleDeletePet = () => {
    if (selectedPetIndex !== null) {
      setPets((prevPets) => prevPets.filter((_, i) => i !== selectedPetIndex));  // ลบสัตว์เลี้ยงที่ index ที่เลือก
      setSelectedPetIndex(null); // รีเซ็ตค่า index
    }
    setOpenDeleteDialog(false); // ปิด Dialog หลังจากลบเสร็จ
  };

  // ฟังก์ชันยกเลิกการลบ
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false); // ปิด Dialog โดยไม่ลบ
  };


  const handleGenderChange = (event, newGender) => {
    if (newGender !== null) {
      setGender(newGender);
    }
  }
  const handleBirthDateChange = (newDate) => {
    setBirthDate(newDate);
    calculateAge(newDate);
  };

  const calculateAge = (date) => {
    if (!date || !(date instanceof Date)) return;
    const today = dayjs();
    const birthDay = dayjs(date);
    const years = today.diff(birthDay, 'year');
    const months = today.diff(birthDay.add(years, 'year'), 'month');
    const days = today.diff(birthDay.add(years, 'year').add(months, 'month'), 'day');
    setAge({ years, months, days });
  };
  

  const resetForm = () => {
    setFirstName('');
    setLastNameOwner('');
    setPhoneNumber('');
    setPhoneEmergency('');
    setAddress('');
    setProvince('');
    setPostalCode('');
    setPetName('');
    setPetColor('');
    setPetSpecies('');
    setPetBreed('');
    setPetSpayed(false);
    setMicrochip('');
    setBirthDate(null);
    setAge({ years: '', months: '', days: '' });
    setPets([])
  }
  const clearPetForm = () => {
    setPetName('');
    setPetColor('');
    setPetBreed('');
    setGender('');
    setBirthDate(null);
    setAge({ years: '', months: '', days: '' });
    setPetSpayed(false);
    setMicrochip('');
    setPetSpecies('');
  };

  const handleCreateData = async () => {
    try {
      const ownerData = {
        first_name: firstNameOwner,
        last_name: lastNameOwner,
        phone_number: phoneNumber,
        phone_emergency: phoneEmergency,
        address: address,
        province: province,
        postal_code: postalCode,
      };

      const combinedData = {
        owner: ownerData, // ข้อมูลเจ้าของ
        pets: [...pets], // รายการสัตว์เลี้ยง
      };

      if (combinedData.pets.length > 0) {
        await clinicAPI.post(`/create-owner-pet`, combinedData);
        setSnackbar({
          open: true,
          message: 'ลงทะเบียนสำเร็จ',
          severity: 'success',
        });
        resetForm();
      } else {
        setSnackbar({
          open: true,
          message: 'กรุณาเพิ่มสัตว์เลี้ยง',
          severity: 'warning',
        });
      }      

    } catch (error) {
      console.error('Error saving data:', error);
      setSnackbar({
        open: true, 
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน', 
        severity: 'warning'})

      setTimeout(() => {
        setSnackbar('');
      }, 2000);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>  
    <Box display="flex" height="100vh" sx={{backgroundColor: '#e0e0e0'}}>
      <Sidebar />
      <Box className="register-container"
        sx={{
        flex: 1,
        padding: 2, // Equivalent to 20px padding
        display: 'flex',
        flexDirection: 'column',
      }}>

        <Paper sx={{ p: 3 }} >
        <Typography variant="h4" gutterBottom>
          เวชระเบียน
        </Typography>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            centered={false}
            TabIndicatorProps={{
              style: {
                backgroundColor: 'black',
              },
            }}
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
            }}
          >
            <StyledTab label="ลงทะเบียนสัตว์เลี้ยงใหม่" className="tab-button" />
            <StyledTab label="ค้นหาข้อมูลลูกค้า" className="tab-button" />
          </Tabs>

          <Box p={3} >
            {activeTab === 0 ? (
              <Box>
                <Typography variant="h5" gutterBottom>
                  ลงทะเบียนสัตว์เลี้ยงใหม่
                </Typography>
                <Snackbar
                  open={snackbar.open}
                  autoHideDuration={6000}
                  onClose={handleSnackbarClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} // สามารถปรับตำแหน่งได้
                >
                  <Alert 
                    onClose={handleSnackbarClose} 
                    severity={snackbar.severity} 
                    sx={{ width: '100%' }}
                  >
                    {snackbar.message}
                  </Alert>
                </Snackbar>

                <Box component="form" noValidate autoComplete="off" className="register-form"
                      sx={{
                          backgroundColor: '#f9f9f9',
                          padding: '20px',
                          borderRadius: '8px',
                          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                        }}>
                  <Box className="form-row" sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 , }}>
                    <TextField
                      label="ชื่อลูกค้า"
                      value={firstNameOwner}
                      variant="outlined"
                      fullWidth
                      required
                      onChange={(e) => setFirstName(e.target.value)}
                      sx={{ mr: 2 }}
                    />
                    <TextField
                      label="นามสกุล"
                      value={lastNameOwner}
                      variant="outlined"
                      fullWidth
                      onChange={(e) => setLastNameOwner(e.target.value)}
                      sx={{ mr: 2 }}
                    />
                  </Box>
                  <Box className="form-row" sx={{ display: 'flex', justifyContent: 'space-between',mb: 2 ,}}>
                    <TextField
                    label="เบอร์โทรศัพท์"
                    name="phoneNumber"
                    variant="outlined"
                    value={phoneNumber}
                    fullWidth
                    required
                    inputProps={{ maxLength: 10 }} 
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    sx={{ mr: 2 }}
                  />
                    <TextField
                    label="เบอร์โทรศัพท์ฉุกเฉิน"
                    name="phoneE"
                    variant="outlined"
                    value={phoneEmergency}
                    fullWidth
                    inputProps={{ maxLength: 10 }} 
                    onChange={(e) => setPhoneEmergency(e.target.value)}
                    sx={{ mr: 2 }}
                  />
                  </Box>
                  <Box className="form-row" sx={{ display: 'flex', justifyContent: 'space-between',mb: 2 , }}> 
                    <TextField
                    label="ที่อยู่"
                    name="address"
                    variant="outlined"
                    value={address}
                    fullWidth
                    onChange={(e) => setAddress(e.target.value)}
                    sx={{ mr: 2, }}
                  />
                  </Box>

                  <Box className="form-row" sx={{ display: 'flex', justifyContent: 'space-between',mb: 2 , }}>
                    <TextField
                    label="จังหวัด"
                    name="province"
                    variant="outlined"
                    value={province}
                    fullWidth
                    onChange={(e) => setProvince(e.target.value)}
                    sx={{ mr: 2 }}
                  /> 
                   <TextField
                  label="รหัสไปรษณีย์"
                  name="รหัสไปรษณีย์"
                  variant="outlined"
                  value={postalCode}
                  fullWidth
                  inputProps={{ maxLength: 5 }} 
                  onChange={(e) => setPostalCode(e.target.value)}
                  sx={{ mr: 2 }}
                />
                  </Box>
                  <Typography variant="h6" sx={{ mt: 3 }}>
                      สัตว์เลี้ยงของคุณ
                      <Button 
                        variant="contained" 
                        onClick={() => handleClickOpen({}, null)}
                        className="submit-button"
                        sx={{ 
                          padding: '8px 5px',
                          fontSize: '16px',
                          minWidth: '200px',
                          ml: 3,}}
                      >
                      ลงทะเบียนสัตว์เลี้ยงใหม่
                      </Button>
                  </Typography>
                  <Box>
                    {pets.map((pet, index) => (
                      <Box 
                        key={index}
                        sx={{
                          backgroundColor: '#ffffff', // สีพื้นหลังสำหรับแต่ละกล่อง
                          padding: 2,
                          borderRadius: 2,
                          mt: 2, // ระยะห่างระหว่างกล่อง
                          boxShadow: 1, // เงาของกล่อง
                        }}
                      >
                        <Typography>ชื่อสัตว์เลี้ยง: {pet.pet_name}</Typography>
                        <Typography>สี: {pet.pet_color}</Typography>
                        <Typography>พันธุ์: {pet.pet_breed}</Typography>
                        <Typography>ประเภท: {pet.pet_species}</Typography>
                      
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end', // ให้ปุ่มอยู่ที่มุมขวา
                            gap: 1, // ระยะห่างระหว่างปุ่ม
                            marginTop: 2, // ระยะห่างจากข้อความ
                          }}
                        >
                          <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={() => handleClickOpen(pet, index)}// ฟังก์ชันสำหรับการแก้ไข
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              padding: 1,
                              borderRadius: 1, // มุมมน
                            }}
                          >
                            <EditIcon sx={{ marginRight: 1 }} /> {/* ไอคอนแก้ไข */}
                            แก้ไข
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="secondary" 
                            onClick={() =>handleOpenDeleteDialog(index)} // ส่ง index ของสัตว์เลี้ยงที่จะลบ
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              padding: 1,
                              borderRadius: 1, // มุมมน
                            }}
                          >
                            <ClearIcon sx={{ marginRight: 1 }} /> {/* ไอคอนยกเลิก */}
                            ยกเลิก
                          </Button>
                          {/* Dialog ยืนยันการลบ */}
                          <Dialog
                            open={openDeleteDialog}
                            onClose={handleCloseDeleteDialog}
                          >
                            <DialogTitle>ยืนยันการลบ</DialogTitle>
                            <DialogContent>
                              <Typography variant="body1">คุณต้องการลบสัตว์เลี้ยงนี้หรือไม่?</Typography>
                            </DialogContent>
                            <DialogActions>
                              <Button onClick={handleCloseDeleteDialog} color="primary">
                                ยกเลิก
                              </Button>
                              <Button onClick={handleDeletePet} color="secondary">
                                ลบ
                              </Button>
                            </DialogActions>
                          </Dialog>
                        </Box>
                      </Box>
                    ))}
                    
                    
                  </Box> 
                   <Button 
                      variant="contained" 
                      onClick={handleCreateData} 
                      className="submit-button"
                      sx={{marginLeft: 'auto',
                            width: '100px', 
                            mt:2 ,
                            display: 'flex', 
                            alignItems: 'center', 
                            padding: 1,
                            borderRadius: 1}}
                    >
                    บันทึก
                    </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography variant="h5" gutterBottom>
                  ค้นหาข้อมูลลูกค้า
                </Typography>
                <Box component="form" noValidate autoComplete="off" className="search-form">
                  <RegisterSearch />
                </Box>
              </Box>
            )}
            
          </Box>
        </Paper>
      </Box>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          เพิ่มประวัติสัตว์เลี้ยงใหม่
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box
            component="form"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 2,
            }}
          >
            <Box sx={{ flex: 2 }}>
              <TextField
                label="ชื่อสัตว์เลี้ยง"
                value={petName}
                fullWidth
                required
                onChange={(e) => setPetName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
              select
              label="ประเภทสัตว์เลี้ยง"
              value={petSpecies}
              fullWidth
              required
              onChange={(e) => {
                setPetSpecies(e.target.value);
              }}
              sx={{ mb: 2 }}
            >
              <MenuItem value="แมว">แมว</MenuItem>
              <MenuItem value="สุนัข">สุนัข</MenuItem>
              <MenuItem value="อื่นๆ">อื่นๆ</MenuItem>
            </TextField>

            {petSpecies === "อื่นๆ" ? (
              <TextField
                label="กรุณาระบุประเภทสัตว์เลี้ยง"
                value={otherPetSpecies}
                fullWidth
                required
                onChange={(e) => setOtherPetSpecies(e.target.value)}
                sx={{ mb: 2 }}
              />
            ) : (
              <Autocomplete
                options={petSpecies === "แมว" ? CatBreed : petSpecies === "สุนัข" ? DogBreed : []}
                value={petBreed}
                onChange={(event, newValue) => {
                  setPetBreed(newValue);
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="พันธุ์ของสัตว์เลี้ยง" 
                    variant="outlined" 
                    required
                    fullWidth 
                  />
                )}
                freeSolo // Allow custom input
                sx={{ 
                  '& .MuiAutocomplete-listbox': {
                    maxHeight: '200px', 
                    overflowY: 'auto',
                  }
                }}
                isOptionEqualToValue={(option, value) => option === value}
                getOptionLabel={(option) => option}
              />
            )}

              <TextField
                label="สี/ตำหนิ"
                value={petColor}
                fullWidth
                onChange={(e) => setPetColor(e.target.value)}
                sx={{ mb: 2 , mt:2}}
              />
              <Box>
                <FormControlLabel control={
                  <Checkbox
                    checked={petSpayed}
                    onChange={(e) => setPetSpayed(e.target.checked)}
                  />
                }
                label="เคยทำหมัน"
                />
              </Box>

              <DatePicker
                label="วันเกิด"
                value={birthDate}
                onChange={handleBirthDateChange}
                maxDate={new Date()}
                renderInput={(params) => <TextField {...params} fullWidth />}
                views={['year', 'month', 'day']}
                sx={{ mt: 2 }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <TextField 
                  label="ปี" 
                  value={age.years !== undefined ? `${age.years} ปี` : ''} 
                  sx={{ width: '100%' ,mt:1}} 
                  InputProps={{ readOnly: true }} 
                /> 
                <TextField 
                  label="เดือน" 
                  value={age.months !== undefined ? `${age.months} เดือน` : ''}
                  sx={{ width: '100%', mt:1}} 
                  InputProps={{ readOnly: true }} 
              /> 
              <TextField 
                  label="วัน" 
                  value={age.days !== undefined ? `${age.days} วัน` : ''} 
                  sx={{ width: '100%',mt:1}} 
                  InputProps={{ readOnly: true }} 
            />  
              </Box>
              
              
              <ToggleButtonGroup
                value={gender}
                exclusive
                onChange={handleGenderChange}
                fullWidth
                sx={{ mt: 3 }}
              >
                <ToggleButton
                  value="male"
                  sx={{
                    "&.Mui-selected": {
                      backgroundColor: "#2196f3", // สีที่ต้องการเมื่อถูกเลือก
                      color: "#fff",             // สีตัวอักษร
                      "&:hover": {
                        backgroundColor: "#1976d2", // สีเมื่อ hover ขณะเลือก
                      },
                    },
                  }}
                >
                  <Typography>♂ male</Typography>
                </ToggleButton>
                <ToggleButton
                  value="female"
                  sx={{
                    "&.Mui-selected": {
                      backgroundColor: "#f06292", // สีที่ต้องการเมื่อถูกเลือก
                      color: "#fff",
                      "&:hover": {
                        backgroundColor: "#e91e63", // สีเมื่อ hover ขณะเลือก
                      },
                    },
                  }}
                >
                  <Typography>♀ female</Typography>
                </ToggleButton>
              </ToggleButtonGroup>

              <TextField
                label="MicrochipNumber"
                value={petMicrochip}
                fullWidth
                inputProps={{ maxLength: 15 }} 
                onChange={(e) => setMicrochip(e.target.value)}
                sx={{ mt: 2 }}
              />

              <TextField label="ประวัติการฉีดวัคซีน" multiline rows={4} fullWidth sx={{ mt: 2 }} />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} sx={{ width: '150px' }}>ยกเลิก</Button>
          <Button 
            variant="contained" 
            onClick={handleSavePet} 
            sx={{ width: '100px' }}
            className="submit-button"
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </LocalizationProvider >  
  );
};

export default RegisterPage;
