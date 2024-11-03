import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

const EditPetDialog = ({ open, onClose, pet, onSave }) => {
  const [formData, setFormData] = useState({
    pet_name: pet.pet_name,
    pet_gender: pet.pet_gender,
    pet_species: pet.pet_species,
    pet_color: pet.pet_color,
    pet_breed: pet.pet_breed,
    SpayedNeutered: pet.SpayedNeutered,
    pet_birthday: pet.pet_birthday,
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
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
        <TextField
          label="พันธุ์"
          name="pet_breed"
          value={formData.pet_breed}
          onChange={handleChange}
          fullWidth
          margin="dense"
        />
        <TextField
          label="ทำหมัน"
          name="SpayedNeutered"
          value={formData.SpayedNeutered}
          onChange={handleChange}
          fullWidth
          margin="dense"
          select
          SelectProps={{ native: true }}
        >
          <option value={1}>ทำหมัน</option>
          <option value={0}>ไม่ได้ทำหมัน</option>
        </TextField>
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
