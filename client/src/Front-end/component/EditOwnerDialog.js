import React, { useState,useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

import { clinicAPI } from "../../utils/api";

const EditOwnerDialog = ({ open, onClose, owner, onSave }) => {
  
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    owner_id: owner?.owner_id || '',
    first_name: owner?.first_name || '',
    last_name: owner?.last_name || '' , 
    phone_number: owner?.phone_number || '',
    phone_emergency: owner?.phone_emergency || '' ,
    address: owner?.address || '',
    province: owner?.province || '',
    postal_code: owner?.postal_code || '',
  });

  useEffect(() => {
    if (open && owner) {
      setOriginalData(owner); // เก็บค่าต้นฉบับ
      setFormData(owner); // ตั้งค่าฟอร์มให้เป็นค่าปัจจุบัน
    }
  }, [open, petData]);
  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        const response = await clinicAPI.get(`/owners/${owner.owner_id}`);
        if (response.status === 200) { // Check for a successful response
          const data = response.data;
          setFormData({
            owner_id: data.owner_id,
            first_name: data.first_name,
            last_name: data.last_name,
            phone_number: data.phone_number,
            phone_emergency: data.phone_emergency,
            address: data.address,
            province: data.province,
            postal_code: data.postal_code,
          });
          // console.log('owner', data.owner_id); 
        } else {
          console.error('Error fetching owner data:', response.data);
        }
      } catch (error) {
        console.error('Error fetching owner data:', error);
      }
    };
  
    if (owner?.owner_id) {
      fetchOwnerData();
    }
  }, [owner]);
  

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await clinicAPI.put(`/owners/${owner.owner_id}`, formData);
  
      if (response.status === 200) {
        onSave(formData); // ส่งข้อมูลกลับไปยัง parent
        onClose(); // ปิด dialog
      } else {
        console.error("Failed to update data");
      }
    } catch (error) {
      console.error("Error updating data:", error);
    }
  };
  
  const handleCancel = () => {
    setFormData(originalData); // คืนค่าต้นฉบับกลับไป
    onClose(); // ปิด dialog
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
        <Button onClick={handleCancel}>ยกเลิก</Button>
        <Button onClick={handleSave} color="primary">บันทึก</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditOwnerDialog;
