import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Autocomplete, TextField, Button,Avatar
} from '@mui/material';
import PetDialog from './Addnewpets';
import { useNavigate ,useLocation} from 'react-router-dom';
import { clinicAPI } from "../../utils/api";

const RegisterSearch = () => {
  const [owners, setOwners] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState(null);
  const [pets, setPets] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const location = useLocation();

  const { locationOwnerID } = location.state || {};
  // console.log("locationOwnerID : ",locationOwnerID)

  useEffect(() => {
    if (!open && selectedOwnerId) {
      // รีเฟรชข้อมูลสัตว์เลี้ยงหลังจากปิด Dialog
      clinicAPI.get(`/pets?owner_id=${selectedOwnerId}`)
        .then(response => setPets(response.data))
        .catch(error => console.error('Error fetching pets:', error));
    }
  }, [open, selectedOwnerId]); // ตรวจจับการเปลี่ยนแปลงของ open และ selectedOwnerId
  

  
  useEffect(() => {
    // Fetch owners when component mounts
    clinicAPI.get(`/owners`)
      .then(response => setOwners(response.data))
      .catch(error => console.error('Error fetching owners:', error));

    if (locationOwnerID !== undefined) {
      setSelectedOwnerId(locationOwnerID);
    }

  }, [locationOwnerID]);

  useEffect(() => {
    // Fetch pets when an owner is selected
    if (selectedOwnerId) {
      clinicAPI.get(`/pets?owner_id=${selectedOwnerId}`)
        .then(response => {
          setPets(response.data);
          // console.log('setPets', response.data);
        })
        .catch(error => console.error('Error fetching pets:', error));
    } else {
      setPets([]);
    }
  }, [selectedOwnerId]);

  return (
    <Box>
      <Box display="flex" gap={2} alignItems="center">
        {/* Autocomplete for searching and selecting owners */}
        <Autocomplete 
          options={owners || []} // ป้องกัน owners เป็น undefined
          getOptionLabel={(owner) => `${owner.first_name} ${owner.last_name}`}
          onChange={(event, value) => setSelectedOwnerId(value ? value.owner_id : null)}
          value={selectedOwnerId ? owners.find(owner => owner.owner_id === selectedOwnerId) || null : null}
          isOptionEqualToValue={(option, value) => option?.owner_id === value?.owner_id} // ป้องกัน error ถ้า value เป็น null
          renderInput={(params) => (
            <TextField
              {...params}
              label="ค้นหาข้อมูลด้วย ชื่อ-นามสกุล"
              variant="outlined"
              fullWidth
              margin="normal"
            />
          )}
          sx={{ width: '48%' }}
          renderOption={(props, option) => (
            <li {...props} key={option.owner_id}>
              {`${option.first_name} ${option.last_name}`}
            </li>
          )}
        />
    
    
        {/* Always display TextField for phone number */}
        <Autocomplete 
          options={owners || []}
          getOptionLabel={(owner) => owner.phone_number}
          onChange={(event, value) => setSelectedOwnerId(value ? value.owner_id : null)}
          value={selectedOwnerId ? owners.find(owner => owner.owner_id === selectedOwnerId) || null : null}
          isOptionEqualToValue={(option, value) => option?.owner_id === value?.owner_id}
          renderInput={(params) => (
            <TextField {...params} label="ค้นหาด้วยเบอร์โทรศัพท์" variant="outlined" fullWidth margin="normal" />
          )}
          sx={{ width: '48%' }}
          renderOption={(props, option) => (
            <li {...props} key={option.owner_id}>
              {option.phone_number}
            </li>
          )}
        />
      </Box>

      {/* Display pets of the selected owner */}
      {selectedOwnerId && pets.length > 0 && (
        <>
          <Box>
            <Typography variant="h6" sx={{ mt: 3 }}>
              รายการสัตว์เลี้ยง
              <React.Fragment>
                <Button variant="outlined" onClick={handleClickOpen}>
                  ลงทะเบียนสัตว์เลี้ยงใหม่
                </Button>
                <PetDialog open={open} onClose={handleClose} 
                  selectedOwnerId={selectedOwnerId}
                  setPets={setPets}
                  isEditMode={false}
                />
              </React.Fragment>
            </Typography>
          </Box>
          
          <Box>
            {pets.map((selectedPet) => (
              <Box
                key={selectedPet.pet_id}
                sx={{
                  backgroundColor: '#e0e0e0',
                  padding: 2,
                  borderRadius: 2,
                  mt: 2,
                  boxShadow: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {selectedPet.image_url && (
                  <Box
                    sx={{
                      mr: 2,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      width: 150,
                      height: 150,
                    }}
                  >
                    <Avatar
                      src={
                        selectedPet.image_url
                          ? selectedPet.image_url // ใช้ URL จากฐานข้อมูล
                          : '/default-image.png' // ใช้ภาพ Default หากไม่มีรูป
                      }
                      alt={selectedPet.pet_name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                    />
                  </Box>
                )}

                {/* Pet details next to the image */}
                <Box>
                  <Typography variant="h6">{selectedPet.pet_name}</Typography>
                  <Typography>พันธุ์: {selectedPet.pet_breed}</Typography>
                  <Typography>ประเภท: {selectedPet.pet_species}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', ml: 'auto' }}>
                  <Button
                    variant="contained"
                    className="submit-button"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 1,
                      marginRight: 5,
                      padding: '8px 15px',
                      fontSize: '16px',
                    }}
                    onClick={() => {
                      // const owner = owners.find(owner => owner.owner_id === selectedOwnerId);
                      const pet = {
                        petId: selectedPet.pet_id, // ใช้ pets[0] เป็นตัวอย่าง หากต้องการเปลี่ยนสามารถระบุให้ชัดเจน
                      };
                      const owner = {
                        ownerId: selectedOwnerId, // หาก selectedOwnerId เป็น ID เดียว ไม่ใช่อ็อบเจกต์
                      };                
                      navigate('/clinic/pet-profile', { state: { pet, owner ,appointmentId: null } });
                    }}
                  >
                    โปรไฟล์
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </>
      )}

      {selectedOwnerId && pets.length === 0 && (
        <Typography variant="h6" color="textSecondary" style={{ marginTop: '20px' }}>
          ไม่พบข้อมูลการลงทะเบียน
        </Typography>
      )}
    </Box>
  );
};

export default RegisterSearch;
