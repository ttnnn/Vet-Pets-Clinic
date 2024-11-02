import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Paper, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, ToggleButtonGroup, ToggleButton, MenuItem
  , Autocomplete
 } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Sidebar from './Sidebar';
import { styled } from '@mui/material/styles';
import './RegisterPage.css';
import axios from 'axios';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import Alert from '@mui/material/Alert';
import CheckIcon from '@mui/icons-material/Check';
import RegisterSearch from './component/RegisterSearch';
import { DogBreed, CatBreed } from './component/Breeds';
import dayjs from 'dayjs';
import 'dayjs/locale/th';  // นำเข้า locale ภาษาไทย

dayjs.locale('th'); // ตั้งค่าให้ dayjs ใช้ภาษาไทย


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

const RegisterPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [gender, setGender] = useState('male');
  const [imagePreview, setImagePreview] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
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
  const [alertMessage, setAlertMessage] = useState(''); 
  const [alertSeverity, setAlertSeverity] = useState('success'); 

    
  const handleSavePet = () => {
    const petData = {
      pet_name: petName,
      pet_color: petColor,
      pet_breed: petBreed,
      pet_gender: gender,
      pet_birthday: birthDate ? dayjs(birthDate).format('YYYY-MM-DD') : '',
      pet_age: age.years,
      SpayedNeutered: petSpayed ? 1 : 0,
      MicrochipNumber: petMicrochip,
      pet_species: petSpecies,
    };
  //ตอนเช็ควนลูปแก้ไขข้อมูลสัตว์เลี้ยงแต่ละตัว
    if (editIndex !== null) {
      console.log("Updating pet at index:", editIndex, "with data:", petData);
      setPets((prevPets) => prevPets.map((pet, i) => (i === editIndex ? petData : pet)));
    } else {
      console.log("Adding new pet:", petData);
      setPets((prevPets) => [...prevPets, petData]);
    }
  
    console.log("Updated pets list:", pets);
  
    setOpen(false);
    clearPetForm();
    setEditIndex(null);
  };
  


  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // const handleClickOpen = () => {
    // setOpen(true)
  // };
  const handleClickOpen = (pet, index) => {
    setPetName(pet.pet_name);
    setPetColor(pet.pet_color);
    setPetBreed(pet.pet_breed);
    setGender(pet.pet_gender);
    setBirthDate(pet.pet_birthday ? dayjs(pet.pet_birthday).toDate() : null);
    setAge({ years: pet.pet_age, months: '', days: '' }); // แก้ไขได้ถ้าคำนวณอายุในรูปแบบนี้
    setPetSpayed(pet.SpayedNeutered);
    setMicrochip(pet.MicrochipNumber);
    setPetSpecies(pet.pet_species);
    setEditIndex(index); // เก็บ index ของสัตว์เลี้ยงที่จะแก้ไข
    setOpen(true);
  };
  

  const handleClose = () => {
    setOpen(false);
    clearPetForm()
    setEditIndex(null);
    setImagePreview(null);  // Clear image preview when closing

  };
  const handleDeletePet = (index) => {
    setPets((prevPets) => prevPets.filter((_, i) => i !== index)); // Remove pet at index
  };

  const handleGenderChange = (event, newGender) => {
    if (newGender !== null) {
      setGender(newGender);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBirthDateChange = (newDate) => {
    setBirthDate(newDate);
    calculateAge(newDate);
  };

  const calculateAge = (date) => {
    if (!date) return;
    const today = dayjs();
    const birthDay = dayjs(date);
    const years = today.diff(birthDay, 'year');
    const months = today.diff(birthDay.add(years, 'year'), 'month');
    const days = today.diff(birthDay.add(years, 'year').add(months, 'month'), 'day');
    setAge({ years, months, days });
  };
  

  const resetForm = () => {
    setImagePreview(null);
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
      console.log('data:',combinedData)

      if(combinedData.pets.length > 0){
        await axios.post(`${api}/create-owner-pet`, combinedData);
        alert('Data saved successfully!');
        setAlertSeverity('success');
        setAlertMessage('ลงทะเบียนสำเร็จ')
        resetForm();
        setTimeout(() => {
          setAlertMessage('');
        }, 2000);
      }else{
        alert("กรุณาเพิ่มสัตว์เลี้ยง")
      }

    } catch (error) {
      console.error('Error saving data:', error);
      setAlertSeverity('success');
      setAlertMessage('กรุณากรอกข้อมูลให้ครบถ้วน')

      setTimeout(() => {
        setAlertMessage('');
      }, 2000);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>  
    <Box className="main-container">
      <Sidebar />
      <Box className="register-container">
        <Paper sx={{ width: '100%' }}>
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

          <Box p={3}>
            {activeTab === 0 ? (
              <Box>
                <Typography variant="h4" gutterBottom>
                  ลงทะเบียนสัตว์เลี้ยงใหม่
                </Typography>
                {alertMessage && (
                   <Alert severity={alertSeverity} icon={alertSeverity === 'success' ? <CheckIcon fontSize="inherit" /> : undefined}>
                      {alertMessage}
                  </Alert>)}

                <Box component="form" noValidate autoComplete="off" className="register-form">
                  <Box className="form-row">
                    <TextField
                      label="ชื่อลูกค้า"
                      value={firstNameOwner}
                      variant="outlined"
                      fullWidth
                      required
                      onChange={(e) => setFirstName(e.target.value)}
                      sx={{ mr: 5 }}
                    />
                    <TextField
                      label="นามสกุล"
                      value={lastNameOwner}
                      variant="outlined"
                      fullWidth
                      onChange={(e) => setLastNameOwner(e.target.value)}
                      sx={{ mr: 5 }}
                    />
                  </Box>
                  <Box className="form-row"> 
                    <TextField
                    label="เบอร์โทรศัพท์"
                    name="phoneNumber"
                    variant="outlined"
                    value={phoneNumber}
                    fullWidth
                    required
                    inputProps={{ maxLength: 10 }} 
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    sx={{ mr: 5 }}
                  />
                    <TextField
                    label="เบอร์โทรศัพท์ฉุกเฉิน"
                    name="phoneE"
                    variant="outlined"
                    value={phoneEmergency}
                    fullWidth
                    inputProps={{ maxLength: 10 }} 
                    onChange={(e) => setPhoneEmergency(e.target.value)}
                    sx={{ mr: 5 }}
                  />
                  </Box>
                  <Box className="form-row"> 
                    <TextField
                    label="ที่อยู่"
                    name="address"
                    variant="outlined"
                    value={address}
                    fullWidth
                    onChange={(e) => setAddress(e.target.value)}
                    sx={{ mr: 5 }}
                  />
                  </Box>

                   <Box className="form-row"> 
                    <TextField
                    label="จังหวัด"
                    name="province"
                    variant="outlined"
                    value={province}
                    fullWidth
                    onChange={(e) => setProvince(e.target.value)}
                    sx={{ mr: 5 }}
                  /> 
                   <TextField
                  label="รหัสไปรษณีย์"
                  name="รหัสไปรษณีย์"
                  variant="outlined"
                  value={postalCode}
                  fullWidth
                  inputProps={{ maxLength: 5 }} 
                  onChange={(e) => setPostalCode(e.target.value)}
                  sx={{ mr: 5 }}
                />
                  </Box>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                      สัตว์เลี้ยงของคุณ
                      <Button 
                        variant="contained" 
                        onClick={() => handleClickOpen({}, null)}
                        className="submit-button"
                        sx={{ padding: 2, ml: 3 }}
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
                            onClick={() => handleDeletePet(index)} // ฟังก์ชันสำหรับการยกเลิก
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
                        </Box>
                      </Box>
                    ))}
                    
                    
                  </Box> 
                   <Button 
                      variant="contained" 
                      onClick={handleCreateData} 
                      className="submit-button"
                      sx={{marginLeft: 'auto',
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
                <Typography variant="h4" gutterBottom>
                  ค้นหาข้อมูลลูกค้า
                </Typography>
                <Box component="form" noValidate autoComplete="off" className="search-form">
                  <RegisterSearch/>
                </Box>
              </Box>
            )}
            
          </Box>
        </Paper>
      </Box>
          

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <label htmlFor="image-upload">
                <Button
                  component="span"
                  variant="contained"
                  className="upload-button"  // ใช้ className เพื่อใช้สไตล์ที่กำหนดใน CSS
                >
                  {imagePreview ? (
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="Pet"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '4px',
                      }}
                    />
                  ) : (
                    <Typography className="upload-button-text">อัพโหลดรูปภาพ</Typography>
                  )}
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  hidden
                />
              </label>
            </Box>
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
                console.log(e.target.value); 
                setPetSpecies(e.target.value);
              }}
              sx={{ mb: 2 }}
            >
              <MenuItem value="แมว">แมว</MenuItem>
              <MenuItem value="สุนัข">สุนัข</MenuItem>
              <MenuItem value="อื่นๆ">อื่นๆ</MenuItem>
            </TextField>

            <Autocomplete
            options={petSpecies === "แมว" ? CatBreed : DogBreed}
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
            // Optional: limit the height of the dropdown
            sx={{ 
                '& .MuiAutocomplete-listbox': {
                    maxHeight: '200px', 
                    overflowY: 'auto' ,
                }
            }}
            isOptionEqualToValue={(option, value) => option === value} // Ensure correct matching
            // Optional: if you want to keep the selected value in the input box
            getOptionLabel={(option) => option} // Use the option as the label
        />
            
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
                <ToggleButton value="male"  >
                  <Typography>♂</Typography>
                </ToggleButton>
                <ToggleButton value="female">
                  <Typography>♀</Typography>
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
          <Button onClick={handleClose}>ยกเลิก</Button>
          <Button 
            variant="contained" 
            onClick={handleSavePet} 
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
