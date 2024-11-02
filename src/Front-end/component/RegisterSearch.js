import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Autocomplete, TextField, Button
} from '@mui/material';
import PetDialog from './Addnewpets';
import { useNavigate } from 'react-router-dom'; 


const api = 'http://localhost:8080'; // Replace with your actual API base URL

const RegisterSearch = () => {
  const [owners, setOwners] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState(null);
  const [pets, setPets] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch owners when component mounts
    axios.get(`${api}/owners`)
      .then(response => setOwners(response.data))
      .catch(error => console.error('Error fetching owners:', error));
  }, []);

  useEffect(() => {
    // Fetch pets when an owner is selected
    if (selectedOwnerId) {
      axios.get(`${api}/pets?owner_id=${selectedOwnerId}`)
        .then(response => {
          setPets(response.data);
        })
        .catch(error => console.error('Error fetching pets:', error));
    } else {
      setPets([]);
    }
  }, [selectedOwnerId]);


  return (
    <Box>
      <Typography variant="h6" gutterBottom>ข้อมูลลูกค้า</Typography>
      <Box display="flex" gap={2}  >
      {/* Autocomplete for searching and selecting owners */}
      <Autocomplete
        options={owners}
        getOptionLabel={(owner) => `${owner.first_name} ${owner.last_name} ` } // Assuming full_name is the field to display
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
        
        sx={{ width: '100%' }}
        renderOption={(props, option) => (
          <li {...props} key={option.owner_id}> {/* Set unique key here */}
            {`${option.first_name} ${option.last_name}`}
          </li>)}
      />
      <Autocomplete
        options={owners}
        getOptionLabel={(owner) => `${owner.phone_number}` } // Assuming full_name is the field to display
        onChange={(event, value) => setSelectedOwnerId(value ? value.owner_id : null)}
        value={selectedOwnerId ? owners.find(owner => owner.owner_id === selectedOwnerId) : null}
        isOptionEqualToValue={(option, value) => option.owner_id === value.owner_id}
        renderInput={(params) => (
        <TextField
          {...params}
          label="ค้นหาข้อมูลด้วย เบอร์โทรศัพท์"
          variant="outlined"
          fullWidth
          margin="normal"
        />
      )}
      sx={{ width: '100%' }}
      renderOption={(props, option) => (
        <li {...props} key={option.owner_id}> {/* Set unique key here */}
          {`${option.phone_number}`}
        </li>)}
    />
    </Box>
      


      {/* Display pets of the selected owner */}
      {selectedOwnerId && pets.length > 0 && (
        <>
          <Typography variant="h7">
            สัตว์เลี้ยงของคุณ 
          </Typography>
          <Button 
            variant="contained" 
            className="submit-button"
            onClick={() => setOpen(true)}
            sx={{ padding: 1, ml:10}}
        >
        ลงทะเบียนสัตว์เลี้ยงใหม่
        </Button>
        <PetDialog
            open={open}
            handleClose={() => setOpen(false)}
            selectedOwnerId={selectedOwnerId}
            setPets={setPets}
            isEditMode={false}
        />
          <Box >
            {pets.map((pet) => (
            <>
              <Box key={pet.pet_id} 
              sx={{
                backgroundColor: '#ffffff', // สีพื้นหลังสำหรับแต่ละกล่อง
                padding: 2,
                borderRadius: 2,
                mt: 2, // ระยะห่างระหว่างกล่อง
                boxShadow: 1, // เงาของกล่อง
               
               
              }}>
                
                 {pet.ImageUrl && (
                  <Box
                  sx={{
                    mr:2,
                    borderRadius: '8px', // กรอบมน
                    overflow: 'hidden', // ป้องกันรูปภาพล้นกรอบ
                    
                  }}
                >
                    <img 
                      src={`http://localhost:8080${pet.ImageUrl}`} 
                      alt={pet.pet_name} 
                      style={{ width: 100, height: 100 }} 
                    />
                  </Box>
                )}
                
                <Typography variant="h6">{pet.pet_name}</Typography>
                <Typography>พันธุ์: {pet.pet_breed}</Typography>
                <Typography>ประเภท: {pet.pet_species}</Typography>
                <Box
                    sx={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end', // ให้ปุ่มอยู่ที่มุมขวา
                      }}>
                <Button  
                        variant="contained" 
                        className="submit-button"
                    sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        borderRadius: 1, // มุมมน
                    }}
                    onClick={()=>{
                      const owner = owners.find(owner => owner.owner_id === selectedOwnerId); // ค้นหาข้อมูลเจ้าของ
                      navigate('/pet-profile', { state: { pet, owner } }); // ส่งข้อมูลสัตว์เลี้ยงและเจ้าของ
                    }}
                    
                    
                    >
                    โปรไฟล์
                </Button>
                </Box>
              </Box>
              </>
            ))}
          </Box>
        </>
      )}
      

      {selectedOwnerId && pets.length === 0 && (
        <Typography variant="h6" color="textSecondary" style={{ marginTop: '20px' }}>
          No pets found for the selected owner.
        </Typography>
      )}
    </Box>
  );
};

export default RegisterSearch;
