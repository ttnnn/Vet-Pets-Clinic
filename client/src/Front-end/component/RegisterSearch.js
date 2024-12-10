import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Autocomplete, TextField, Button
} from '@mui/material';
import PetDialog from './Addnewpets';
import { useNavigate ,useLocation} from 'react-router-dom';

const api = 'http://localhost:8080/api/clinic'; // Replace with your actual API base URL

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
  console.log("locationOwnerID : ",locationOwnerID)

  useEffect(() => {
    // Fetch owners when component mounts
    axios.get(`${api}/owners`)
      .then(response => setOwners(response.data))
      .catch(error => console.error('Error fetching owners:', error));

    if (locationOwnerID !== undefined) {
      setSelectedOwnerId(locationOwnerID);
    }

  }, [locationOwnerID]);

  useEffect(() => {
    // Fetch pets when an owner is selected
    if (selectedOwnerId) {
      axios.get(`${api}/pets?owner_id=${selectedOwnerId}`)
        .then(response => {
          setPets(response.data);
          console.log('setPets', response.data);
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
          options={owners}
          getOptionLabel={(owner) => `${owner.first_name} ${owner.last_name}`}
          onChange={(event, value) => setSelectedOwnerId(value ? value.owner_id : null)}
          value={selectedOwnerId ? owners.find(owner => owner.owner_id === selectedOwnerId) : null}
          isOptionEqualToValue={(option, value) => option.owner_id === value.owner_id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="ค้นหาข้อมูลด้วย ชื่อ-นามสกุล"
              variant="outlined"
              fullWidth
              margin="normal"
            />
          )}
          sx={{ width: '48%' }}  // Set width to 48% for balance with the phone number field
          renderOption={(props, option) => (
            <li {...props} key={option.owner_id}>
              {`${option.first_name} ${option.last_name}`}
            </li>
          )}
        />

        {/* Always display TextField for phone number */}
        <TextField
          label="เบอร์โทรศัพท์"
          variant="outlined"
          fullWidth
          margin="normal"
          value={selectedOwnerId ? owners.find(owner => owner.owner_id === selectedOwnerId)?.phone_number || '' : ''}
          InputProps={{
            readOnly: true, // Make phone number read-only
          }}
          sx={{ width: '48%' }}  // Set width to 48% for balance with the autocomplete field
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
            {pets.map((pet) => (
              <Box
                key={pet.pet_id}
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
                {pet.image_url && (
                  <Box
                    sx={{
                      mr: 2,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      width: 150,
                      height: 150,
                    }}
                  >
                    <img
                      src={`http://localhost:8080${pet.image_url}`} 
                      alt={pet.pet_name}
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
                  <Typography variant="h6">{pet.pet_name}</Typography>
                  <Typography>พันธุ์: {pet.pet_breed}</Typography>
                  <Typography>ประเภท: {pet.pet_species}</Typography>
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
                      const owner = owners.find(owner => owner.owner_id === selectedOwnerId);
                      navigate('/clinic/pet-profile', { state: { pet, owner } });
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
