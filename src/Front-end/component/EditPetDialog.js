import React, { useState ,useEffect} from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,Autocomplete } from '@mui/material';
import dayjs from 'dayjs';
import { DogBreed, CatBreed } from './Breeds';
import 'dayjs/locale/th'; // Import Thai locale for dayjs

dayjs.locale('th'); // Set dayjs to use Thai locale

const EditPetDialog = ({ open, onClose, pet, onSave }) => {
  const formattedDate = pet.pet_birthday ? dayjs(pet.pet_birthday).format('YYYY-MM-DD') : '';
  const [formData, setFormData] = useState({
    owner_id : pet.owner_id,
    pet_name: pet.pet_name,
    pet_gender: pet.pet_gender,
    pet_species: pet.pet_species,
    pet_color: pet.pet_color,
    spayed_neutered: pet.spayed_neutered,
    microchip_number:pet.microchip_number    ,
    pet_birthday: formattedDate,
    otherPetSpecies: pet.pet_species === "อื่นๆ" ? pet.pet_species : "",
  }
);
console.log("pet_birthday", formData.pet_birthday);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSave = () => {
    const petData = {
      ...formData,
      pet_species: formData.pet_species === "อื่นๆ" ? formData.otherPetSpecies : formData.pet_species,
    };
    onSave(petData);  // ส่งข้อมูลให้ onSave
    onClose();        // ปิด dialog
  };
  useEffect(() => {
    // ทำให้ formData อัพเดตตาม pet ใหม่ทุกครั้งเมื่อเปิด Dialog
    setFormData({
      owner_id: pet.owner_id,
      pet_name: pet.pet_name,
      pet_gender: pet.pet_gender,
      pet_species: pet.pet_species,
      pet_color: pet.pet_color,
      spayed_neutered: pet.spayed_neutered,
      microchip_number: pet.microchip_number,
      pet_birthday: formattedDate,
      otherPetSpecies: pet.pet_species === "อื่นๆ" ? pet.pet_species : "",
    });
  }, [pet,formattedDate]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>แก้ไขข้อมูลสัตว์เลี้ยง</DialogTitle>
      <DialogContent>
        <TextField
          label="ชื่อสัตว์เลี้ยง"
          name="pet_name"
          value={formData.pet_name}
          onChange={handleChange}
          fullWidth
          margin="dense"
        />
        <TextField
          label="เพศ"
          name="pet_gender"
          value={formData.pet_gender}
          onChange={handleChange}
          fullWidth
          margin="dense"
        />
        <TextField
          label="ประเภท"
          name="pet_species"
          value={formData.pet_species}
          onChange={handleChange}
          fullWidth
          margin="dense"
        />
        
        <TextField
          label="สี/ตำหนิ"
          name="pet_color"
          value={formData.pet_color}
          onChange={handleChange}
          fullWidth
          margin="dense"
        />
         {formData.pet_species === "อื่นๆ" ? (
            <TextField
              label="กรุณาระบุประเภทสัตว์เลี้ยง"
              value={formData.otherPetSpecies}
              fullWidth
              required
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
          ) : (
            <Autocomplete
            options={formData.pet_species === "แมว" ? CatBreed : formData.pet_species === "สุนัข" ? DogBreed : []}
              value={formData.petBreed}
              onChange={(event, newValue) => {
                setFormData((prev) => ({ ...prev, pet_breed: newValue }));
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
          label="ทำหมัน"
          name="spayed_neutered"
          value={formData.spayed_neutered}
          onChange={handleChange}
          fullWidth
          margin="dense"
          select
          SelectProps={{ native: true }}
        >
          <option value={true}>ทำหมัน</option>
          <option value={false}>ไม่ได้ทำหมัน</option>
        </TextField>
        <TextField
          label="microchipNumber"
          name="microchip"
          value={formData.microchip_number}
          onChange={handleChange}
          fullWidth
          margin="dense"
        />
 
        <TextField
          label="วันเกิด"
          name="pet_birthday"
          value={formData.pet_birthday}
          onChange={handleChange}
          fullWidth
          margin="dense"
          type="date"
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ยกเลิก</Button>
        <Button onClick={handleSave} color="primary">บันทึก</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPetDialog;
