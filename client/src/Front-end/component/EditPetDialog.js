import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Autocomplete } from '@mui/material';
import dayjs from 'dayjs';
import { DogBreed, CatBreed } from './Breeds';
import 'dayjs/locale/th'; // Import Thai locale for dayjs
import { clinicAPI } from "../../utils/api";
dayjs.locale('th'); // Set dayjs to use Thai locale


const EditPetDialog = ({ open, onClose, pet, onSave }) => {
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    owner_id: pet?.owner_id || '',
    pet_name: pet?.pet_name || '',
    pet_gender: pet?.pet_gender || '',
    pet_species: pet?.pet_species || '',
    pet_color: pet?.pet_color || '',
    pet_breed: pet?.pet_breed || '',
    spayed_neutered: pet?.spayed_neutered || false,
    microchip_number: pet?.microchip_number || '',
    pet_birthday: pet?.pet_birthday ? dayjs(pet.pet_birthday).format('YYYY-MM-DD') : '',
    otherPetSpecies: pet?.pet_species === 'อื่นๆ' ? pet.pet_species : '',
  });
  useEffect(() => {
    if (open && pet) {
      setOriginalData(pet);
      setFormData({
        owner_id: pet.owner_id || '',
        pet_name: pet.pet_name || '',
        pet_gender: pet.pet_gender || '',
        pet_species: pet.pet_species || '',
        pet_color: pet.pet_color || '',
        pet_breed: pet.pet_breed || '',
        spayed_neutered: pet.spayed_neutered || false,
        microchip_number: pet.microchip_number || '',
        pet_birthday: pet.pet_birthday ? dayjs(pet.pet_birthday).format('YYYY-MM-DD') : '', 
        otherPetSpecies: pet.pet_species === 'อื่นๆ' ? pet.pet_species : '',
      });
    }
  }, [open, pet]);
  

  useEffect(() => {
    const fetchPetData = async () => {
      try {
        const response = await clinicAPI.get(`/pets/${pet.pet_id}`);
        if (response.status === 200) {
          const data = response.data;  // Axios parses the response body
          setFormData({
            owner_id: data.owner_id,
            pet_name: data.pet_name,
            pet_gender: data.pet_gender,
            pet_species: data.pet_species,
            pet_color: data.pet_color,
            pet_breed: data.pet_breed,
            spayed_neutered: data.spayed_neutered,
            microchip_number: data.microchip_number,
            pet_birthday: data.pet_birthday ? dayjs(data.pet_birthday).format('YYYY-MM-DD') : '',
            otherPetSpecies: data.pet_species === 'อื่นๆ' ? data.pet_species : '',
          });
        } else {
          console.error('Error fetching pet data:', response.data);
        }
      } catch (error) {
        console.error('Error fetching pet data:', error);
      }
    };
    if (pet?.pet_id) {
      fetchPetData();
    }
  }, [pet]);
 
  const handleChange = (event) => {
    const { name, value } = event.target;
    
    setFormData(prevState => ({
      ...prevState,  
      [name]: value 
    }));
  };
  

  const handleSave = async () => {
    const updatedData = {
      ...formData,
      pet_species: formData.pet_species === 'อื่นๆ' ? formData.otherPetSpecies : formData.pet_species,
    };
  
    try {
      const response = await clinicAPI.put(`/pets/${pet.pet_id}`, updatedData);
      
      // Check for success status code
      if (response.status === 200) {
        console.log('Data updated successfully');
        onSave(updatedData); // Send updated data back to parent
        onClose(); // Close the dialog
      } else {
        console.error('Failed to update data:', response.data);
      }
    } catch (error) {
      console.error('Error updating data:', error);
    }
  };
  
  const handleCancel = () => {
    setFormData(originalData); // คืนค่าต้นฉบับกลับไป
    onClose(); // ปิด dialog
  };
  
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
            value={formData.pet_breed}
            onChange={(event, newValue) => {
              setFormData((prev) => ({ ...prev, pet_breed: newValue }));
            }}
            onInputChange={(event, newInputValue) => {
              setFormData((prev) => ({ ...prev, pet_breed: newInputValue }));
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
          value={formData.spayed_neutered ? 'true' : 'false'}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              spayed_neutered: e.target.value === 'true',
            }))
          }
          fullWidth
          margin="dense"
          select
          SelectProps={{ native: true }}
        >
          <option value="true">ทำหมัน</option>
          <option value="false">ไม่ได้ทำหมัน</option>
        </TextField>
        <TextField
          label="Microchip Number"
          name="microchip_number"
          value={formData.microchip_number}
          onChange={handleChange}
          fullWidth
          inputProps={{
            maxLength: 15,   //กรอกได้ไม่เกิน15
         }}
          margin="dense"
        />
        <TextField
          label="วันเกิด"
          name="pet_birthday"
          value={formData.pet_birthday || ''}
          onChange={handleChange}
          fullWidth
          margin="dense"
          type="date"
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>ยกเลิก</Button>
        <Button onClick={handleSave} color="primary">
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPetDialog;
