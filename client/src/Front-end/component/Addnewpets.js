import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions,  ToggleButtonGroup, ToggleButton, MenuItem
    , Autocomplete,Checkbox,FormControlLabel,CircularProgress
   } from '@mui/material';
import { DogBreed, CatBreed } from './Breeds';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { clinicAPI } from "../../utils/api";
import dayjs from 'dayjs';
import 'dayjs/locale/th';  // นำเข้า locale ภาษาไทย

dayjs.locale('th'); // ตั้งค่าให้ dayjs ใช้ภาษาไทย

const PetDialog = ({ open, onClose , selectedOwnerId, setPets}) => {
  const [petName , setPetName] = useState('');
  const [petColor , setPetColor] = useState('');
  const [petSpecies , setPetSpecies] = useState('');
  const [petBreed , setPetBreed] = useState('');
  const [petSpayed , setPetSpayed] = useState(false);
  const [petMicrochip , setMicrochip] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState({});
  const [gender, setGender] = useState('male');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const[otherPetSpecies,setOtherPetSpecies] = useState('')
  const [loading, setLoading] = useState(false);

  // Populate the form fields with existing pet data when editing
  // const Images = `http://localhost:8080${petData.ImageUrl}


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
  };

  const handleSavePet = async () => {
    if (!petName || !petSpecies || (petSpecies !== "อื่นๆ" && !petBreed) || !birthDate) {
        setAlertSeverity("error");
        setAlertMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
        setTimeout(() => setAlertMessage(""), 2000);
        return;
    }

    const petData = {
        owner_id: selectedOwnerId,
        pet_name: petName,
        pet_color: petColor || '',
        pet_breed: petBreed || '',
        pet_gender: gender,
        pet_birthday: birthDate ? dayjs(birthDate).format("YYYY-MM-DD") : "",
        spayed_neutered: petSpayed,
        microchip_number: petMicrochip,
        pet_species: petSpecies === "อื่นๆ" ? otherPetSpecies : petSpecies,
    };
    setLoading(true);
    try {
        const response = await clinicAPI.post(`/pets`, petData, {
            headers: { "Content-Type": "application/json" },
        });

        if (response.status === 200) {
            //  ดึงข้อมูลสัตว์เลี้ยงใหม่และอัปเดตทันที
            const petsResponse = await clinicAPI.get(`/pets?owner_id=${selectedOwnerId}`);
            setPets(petsResponse.data);
            
            setAlertSeverity("success");
            setAlertMessage("ลงทะเบียนสำเร็จ");

            setTimeout(() => {
                setAlertMessage("");
                onClose(); // ปิด Dialog หลังอัปเดตเสร็จ
            }, 1000);

            clearPetForm();
        } else {
            alert("เพิ่มสัตว์เลี้ยงล้มเหลว");
        }
    } catch (error) {
        console.error("Error saving pet data:", error);
        setAlertSeverity("error");
        setAlertMessage("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        setTimeout(() => setAlertMessage(""), 2000);
    }
    setLoading(false);
};


  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>  
    <Dialog
      open={open}
      keepMounted
      onClose={onClose}
      aria-describedby="alert-dialog-slide-description"
    >
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
    <Box sx={{ flex: 2 }}>
      <TextField
        label="ชื่อสัตว์เลี้ยง"
        value={petName || ''} 
        fullWidth
        required
        onChange={(e) => setPetName(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
      select
      label="ประเภทสัตว์เลี้ยง"
      value={petSpecies || ''}
      fullWidth
      required
      onChange={(e) => {
        // console.log(e.target.value); 
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
      value={otherPetSpecies || ''}
      fullWidth
      required
      onChange={(e) => setOtherPetSpecies(e.target.value)}
      sx={{ mb: 2 }}
    />
  ) : (

            <Autocomplete
        options={petSpecies === "แมว" ? CatBreed : petSpecies === "สุนัข" ? DogBreed : []} // ใช้ DogBreed ถ้าเป็นหมา
        value={petBreed} 
        onChange={(event, newValue) => {
          setPetBreed(newValue); // อัปเดตค่าที่เลือกจากรายการ
        }}
        onInputChange={(event, newInputValue) => {
          setPetBreed(newInputValue); // อัปเดตค่าที่พิมพ์เอง
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
        sx={{ 
          '& .MuiAutocomplete-listbox': {
            maxHeight: '200px', 
            overflowY: 'auto',
          }
        }}
        freeSolo // อนุญาตให้พิมพ์เอง
        isOptionEqualToValue={(option, value) => option === value}
        getOptionLabel={(option) => option}
/>

    )}

      <TextField
        label="สี/ตำหนิ"
        value={petColor || ''}
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
        value={birthDate ? new Date(birthDate) : null}
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
        value={gender || '' }
        exclusive
        onChange={handleGenderChange}
        fullWidth
        sx={{ mt: 3 }}
      >
        <ToggleButton value="male"  >
          <Typography>♂ male</Typography>
        </ToggleButton>

        <ToggleButton value="female">
          <Typography>♀ female</Typography>
        </ToggleButton>

      </ToggleButtonGroup>

      <TextField
        label="MicrochipNumber"
        value={petMicrochip || '' }
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
    <Button onClick={()=> {
      onClose()
      clearPetForm()
    }}>
      ยกเลิก
    </Button>
    <Button
      variant="contained"
      onClick={async () => {
        setLoading(true);  // Set loading to true when the button is clicked
        try {
          await handleSavePet(); // ฟังก์ชันบันทึกข้อมูล
          onClose();  // ฟังก์ชันปิด Dialog
          clearPetForm(); // Clear form data
        } catch (error) {
          console.error('Error saving pet:', error);
        } finally {
          setLoading(false);  // Set loading to false once the process is complete
        }
      }}
      className="submit-button"
      disabled={loading}  // Disable the button while loading
    >
      {loading ? <CircularProgress size={24} /> : 'บันทึก'}
    </Button>

      </DialogActions>
    </Dialog>
    </LocalizationProvider>
  );
};  


export default PetDialog;
