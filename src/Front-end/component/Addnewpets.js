import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions,  ToggleButtonGroup, ToggleButton, MenuItem
    , Autocomplete,Checkbox,FormControlLabel
   } from '@mui/material';
import axios from 'axios';
import { DogBreed, CatBreed } from './Breeds';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import 'dayjs/locale/th';  // นำเข้า locale ภาษาไทย

dayjs.locale('th'); // ตั้งค่าให้ dayjs ใช้ภาษาไทย

const api = 'http://localhost:8080'
const PetDialog = ({ open, handleClose, selectedOwnerId, setPets}) => {
  const [petName , setPetName] = useState('');
  const [petColor , setPetColor] = useState('');
  const [petSpecies , setPetSpecies] = useState('');
  const [petBreed , setPetBreed] = useState('');
  const [petSpayed , setPetSpayed] = useState(false);
  const [petMicrochip , setMicrochip] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [gender, setGender] = useState('male');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [imageFile, setImageFile] = useState(null);
  // Populate the form fields with existing pet data when editing
  // const Images = `http://localhost:8080${petData.ImageUrl}

  const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
          setImageFile(file);
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

  const handleGenderChange = (event, newGender) => {
      if (newGender !== null) {
          setGender(newGender);
      }
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

  const clearPetForm = () => {
      setPetName('');
      setPetColor('');
      setPetBreed('');
      setGender('male');
      setBirthDate(null);
      setAge({ years: '', months: '', days: '' });
      setPetSpayed(false);
      setMicrochip('');
      setPetSpecies('');
      setImagePreview(null);
  };

  const handleSavePet = async () => {
    if (!petName || !petSpecies || !petBreed || !birthDate) {
      setAlertSeverity("error");
      setAlertMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
      setTimeout(() => {
        setAlertMessage("");
      }, 2000);
      return;
    }
      const formData = new FormData();
      formData.append("owner_id", selectedOwnerId);
      formData.append("pet_name", petName);
      formData.append("pet_color", petColor);
      formData.append("pet_breed", petBreed);
      formData.append("pet_gender", gender);
      formData.append("pet_birthday", birthDate ? dayjs(birthDate).format("YYYY-MM-DD") : "");
      formData.append("pet_age", age.years);
      formData.append("SpayedNeutered", petSpayed ? 1 : 0);
      formData.append("MicrochipNumber", petMicrochip);
      formData.append("pet_species", petSpecies);
      if (imageFile) {
          formData.append("image", imageFile);
      }

      try {
          const response =  await axios.post(`${api}/pets`, formData, { headers: { "Content-Type": "multipart/form-data" } });

       if (response.status === 200) {
          const petsResponse = await axios.get(`${api}/pets?owner_id=${selectedOwnerId}`);
          setPets(petsResponse.data);
          handleClose();
          clearPetForm();
          setAlertSeverity("success");
          setAlertMessage("ลงทะเบียนสำเร็จ");
          setTimeout(() => {
              setAlertMessage("");
          }, 2000);}else {
            // จัดการเมื่อ response ไม่สำเร็จ
            throw new Error("Failed to save pet data");
        }

      } catch (error) {
          setAlertSeverity("error");
          setAlertMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
          setTimeout(() => {
              setAlertMessage("");
          }, 2000);
      }
  };

  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>  
    <Dialog open={open} onClose={handleClose}>
    <DialogTitle>เพิ่มสัตว์เลี้ยง</DialogTitle>
      <DialogContent dividers>
      {alertMessage && (
            <Typography color={alertSeverity === "error" ? "error" : "success"} variant="subtitle1" sx={{ mb: 2 }}>
              {alertMessage}
            </Typography>
          )}
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
    freeSolo //พิมพ์และเลือกข้อความที่ไม่ได้อยู่ในรายการตัวเลือกที่มีอยู่ใน options ได้ 
    sx={{ 
        '& .MuiAutocomplete-listbox': {
            maxHeight: '200px', 
            overflowY: 'auto' ,
        }
    }}
    isOptionEqualToValue={(option, value) => option === value} // Ensure correct matching
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
    <Button variant="contained" onClick={handleSavePet} className="submit-button">บันทึก</Button>
      </DialogActions>
    </Dialog>
    </LocalizationProvider>
  );
};  


export default PetDialog;
