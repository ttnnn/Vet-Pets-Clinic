import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

const EditOwnerDialog = ({ open, onClose, owner, onSave }) => {
  const [formData, setFormData] = useState({
    first_name: owner.first_name,
    last_name: owner.last_name,
    phone_number: owner.phone_number,
    phone_emergency: owner.phone_emergency,
    address: owner.address,
    province: owner.province,
    postal_code: owner.postal_code,
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
      <DialogTitle>แก้ไขข้อมูลเจ้าของ</DialogTitle>
      <DialogContent>
        <TextField
          label="ชื่อ"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          fullWidth
          margin="dense"
        />
        <TextField
          label="นามสกุล"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          fullWidth
          margin="dense"
        />
        <TextField
          label="เบอร์ติดต่อ"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          inputProps={{ maxLength: 10 }} 
          fullWidth
          margin="dense"
        />
        <TextField
          label="เบอร์ติดต่อฉุกเฉิน"
          name="phone_emergency"
          value={formData.phone_emergency}
          onChange={handleChange}
          inputProps={{ maxLength: 10 }} 
          fullWidth
          margin="dense"
        />
        <TextField
          label="ที่อยู่"
          name="address"
          value={formData.address}
          onChange={handleChange}
          fullWidth
          margin="dense"
        />
        <TextField
          label="จังหวัด"
          name="province"
          value={formData.province}
          onChange={handleChange}
          fullWidth
          margin="dense"
        />
        <TextField
          label="รหัสไปรษณีย์"
          name="postal_code"
          value={formData.postal_code}
          onChange={handleChange}
          fullWidth
          margin="dense"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ยกเลิก</Button>
        <Button onClick={handleSave} color="primary">บันทึก</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditOwnerDialog;
