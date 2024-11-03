const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { generateAppointmentID } = require('./IdGenerator.js');
require('dotenv').config();
const multer = require('multer');
const path = require('path');

const app = express();
// Middleware
app.use(cors());
app.use(express.json()); 

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.log('Error connecting to the database', err);
        return;
    }
    console.log('Connected to the MySQL database');
});
app.get('/', function (req, res) {
  res.send('Hello World');
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../../public/Images')); // save images in the 'uploads' folder
  },
  filename: (req, file, cb) => {
      cb(null, file.fieldname+"_"+Date.now()+ path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.post('/uploads',(req,res) =>{
  console.log(req.file)
});

app.put('/pets/:id', async (req, res) => {
  const { id } = req.params;
  const { 
      owner_id, 
      pet_name,
      pet_color,
      pet_breed,
      pet_gender, 
      pet_birthday, 
      SpayedNeutered, 
      MicrochipNumber, 
      pet_species 
  } = req.body;


  try {
      // สมมติว่าคุณใช้ MySQL
      const result = db.query(
        'UPDATE pets SET owner_id = ?, pet_name = ?, pet_color = ?, pet_breed = ?, pet_gender = ?, pet_birthday = ?, SpayedNeutered = ?, MicrochipNumber = ?, pet_species = ? WHERE pet_id = ?',
        [owner_id, pet_name, pet_color, pet_breed, pet_gender, pet_birthday, SpayedNeutered, MicrochipNumber, pet_species,  id]
      );

      res.status(200).json({ message: 'Pet updated successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating pet' });
  }
});


app.put('/pets/:id/image', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const ImageUrl = req.file ? `/public/Images/${req.file.filename}` : null;

  db.query(
      'UPDATE pets SET ImageUrl = ? WHERE pet_id = ?',
      [ImageUrl, id],
      (err, result) => {
          if (err) return res.status(500).json({ message: 'Error updating pet image' });
          if (result.affectedRows === 0) return res.status(404).json({ message: 'Pet not found' });
          res.status(200).json({ message: 'Pet image updated successfully' });
      }
  );
});




app.put('/owners/:id', (req, res) => {
  const { id } = req.params; // Move this line up to avoid referencing id before it's declared.
  console.log('Updating owner:', id);
  console.log(req.body);
  
  const {
    first_name,
    last_name,
    phone_number,
    phone_emergency,
    address,
    province,
    postal_code,
  } = req.body;

  try {
    db.query(
      'UPDATE owner SET first_name = ?, last_name = ?, phone_number = ?, phone_emergency = ?, address = ?, province = ?, postal_code = ? WHERE owner_id = ?',
      [first_name, last_name, phone_number, phone_emergency, address, province, postal_code, id]
    );

    res.status(200).json({ message: 'Owner updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating owner' });
  }
});

// Search for owners
app.get('/owners', (req, res) => {
    const searchQuery = req.query.search || ''; // Receive search query
    const query = `SELECT * FROM owner  WHERE CONCAT(first_name, ' ', last_name) LIKE ?`;
    
    db.query(query, [`%${searchQuery}%`], (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      res.json(results);
    });
});

// Fetch booked time slots for a specific date and service type
app.get('/appointments/booked-times', (req, res) => {
  console.log("/appointments/booked-times",req.body);
  const { date, type_service } = req.query;

  if (!date || !type_service) {
    return res.status(400).json({ error: 'Date and service type are required' });
  }

  const query = `
    SELECT appointment_time 
    FROM appointment 
    WHERE appointment_date = ? AND type_service = ?
  `;

  db.query(query, [date, type_service], (err, results) => {
    if (err) {
      console.error('Error fetching booked times:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Map results to an array of booked time slots
    const bookedTimeSlots = results.map(row => row.appointment_time);
    res.json(bookedTimeSlots);
  });
});

app.post('/create-owner-pet', (req, res) => {
  console.log("/create-owner-pet",req.body);
  const {
    owner: {
    first_name, 
    last_name, 
    phone_number, 
    phone_emergency, 
    address, 
    province, 
    postal_code},
    pets // Assume `pets` is an array of pet objects
  } = req.body;

  if (!first_name ) {
    return res.status(400).json({ error: 'First name are required' });
  }

  const register_time = new Date();

  // Insert into owner table
  const ownerQuery = `
    INSERT INTO owner (
      first_name, 
      last_name, 
      phone_number, 
      phone_emergency, 
      address, 
      province, 
      postal_code,
      register_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(ownerQuery, 
    [first_name, last_name, phone_number, phone_emergency, address, province, postal_code, register_time], 
    (err, ownerResults) => {
      if (err) {
        console.error('Error inserting into owner table:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      // Get the newly inserted owner_id
      const owner_id = ownerResults.insertId;
      console.log('id',owner_id)
      // Insert multiple pets for the owner
      const petQuery = `
        INSERT INTO pets (
          owner_id, 
          pet_name, 
          pet_color, 
          pet_breed, 
          pet_gender, 
          pet_birthday, 
          pet_age, 
          SpayedNeutered, 
          MicrochipNumber, 
          pet_species
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      // Prepare promises for multiple pet inserts
      const petPromises = pets.map((pet) => {  
        return new Promise((resolve, reject) => {
          db.query(petQuery, 
            [owner_id, pet.pet_name, pet.pet_color, pet.pet_breed, pet.pet_gender, pet.pet_birthday, pet.pet_age, pet.SpayedNeutered, pet.MicrochipNumber, pet.pet_species], 
            (err, petResults) => {
              if (err) {
                reject(err);
              } else {
                resolve(petResults);
              }
            }
          );
        });
      });

      // Execute all pet inserts
      Promise.all(petPromises)
        .then((petResults) => {
          res.json({ ownerResults, petResults });
        })
        .catch((err) => {
          console.error('Error inserting into pet table:', err);
          res.status(500).json({ error: 'Internal Server Error' });
        });
    }
  );
});
app.post('/pets', upload.single('image'), async  (req, res) => {
  console.log("/pets", req.body); // เพิ่มการพิมพ์ข้อมูลในคอนโซล
  console.log("Uploaded file:", req.file); // พิมพ์ข้อมูลไฟล์ที่อัปโหลด

  const { 
    owner_id, 
    pet_name,
    pet_color,
    pet_breed,
    pet_gender, 
    pet_birthday, 
    pet_age, 
    SpayedNeutered, 
    MicrochipNumber, 
    pet_species } = req.body;
    const ImageUrl =  req.file ? `/public/Images/${req.file.filename}` : null;

  
  const sql = 'INSERT INTO pets (owner_id, pet_name, pet_color, pet_breed, pet_gender, pet_birthday, pet_age, SpayedNeutered, MicrochipNumber, pet_species,ImageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

  db.query(sql, [owner_id, pet_name, pet_color, pet_breed, pet_gender, pet_birthday, pet_age, SpayedNeutered, MicrochipNumber, pet_species, ImageUrl], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(201).send({ message: 'Pet added successfully', petId: result.insertId });
  });
});

// Fetch pets by owner_id
app.get('/pets', (req, res) => {
  const ownerId = req.query.owner_id;
  const query = `SELECT * FROM pets WHERE owner_id = ?`;

  db.query(query, [ownerId], (err, results) => {
      if (err) {
          console.error('Error executing query:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
      }
      if (results.length === 0) {
          return res.status(404).json({ message: 'No pets found for this owner' });
      }
      res.json(results);
  });
});


app.get('/personnel', (req, res) => {
    const query = `SELECT personnel_id, first_name, last_name , role   FROM personnel `;

    db.query(query, (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      res.json(results);
    });
});
app.get('/petcage', (req, res) => {
  const petSpecies = req.query.pet_species;
  const query = `SELECT * FROM petcage WHERE pet_species = ? `;

  db.query(query,[petSpecies], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.json(results);
  });
});




app.put('/appointment/:id', (req, res) => {  //จัดการคิว
  
  const { id } = req.params;
  const { status ,queue_status} = req.body; // Expecting the status to be passed in the request body
  console.log('Updating appointment with ID:', id);
  console.log('Updating appointment queue:', queue_status);
  if (!status) {
    return res.status(400).send({ message: 'Status is required' });
  }

  const query = `UPDATE appointment SET status = ? , queue_status = ? WHERE appointment_id = ?`;

  db.query(query, [status,queue_status, id], (err, result) => {
    if (err) {
      console.error('Failed to update appointment status:', err);
      return res.status(500).send({ message: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: 'Appointment not found' });
    }

    return res.send({ message: 'Appointment status updated successfully' });
  });
});

app.put('/postpone/appointment/:id', (req, res) => {  //จัดการคิว
  console.log('/postpone/appointment/:id',req.params )
  const { id } = req.params;
  const { appointment_date , appointment_time} = req.body; // Expecting the status to be passed in the request body
  console.log('Updating appointment with ID:', id);
  console.log('Updating appointment queue:', appointment_date , appointment_time);
  if (!appointment_date && !appointment_time) {
    return res.status(400).send({ message: 'appointment_date and  appointment_time is required' });
  }

  const query = `UPDATE appointment SET appointment_date = ? , appointment_time = ? WHERE appointment_id = ?`;

  db.query(query, [appointment_date , appointment_time, id], (err, result) => {
    if (err) {
      console.error('Failed to update appointment status:', err);
      return res.status(500).send({ message: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: 'Appointment not found' });
    }

    return res.send({ message: 'Appointment status updated successfully' });
  });
});


app.get('/appointment',(req, res)=>{
  const query = `
  select 
      appointment.appointment_id,
      appointment.status ,
      appointment.appointment_date ,
      appointment.appointment_time,
      pets.pet_name,
      CONCAT(owner.first_name, ' ',owner.last_name) AS full_name,
      appointment.type_service,
      appointment.reason,
      appointment.detail_service
      FROM  appointment
      join pets on appointment.pet_id = pets.pet_id
      join owner on appointment.owner_id = owner.owner_id
      `;
      

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.json(results);
  });
})

app.get('/pethotel',(req, res)=>{
  const query = `
  select 
      petshotel.entry_date,
      petshotel.exit_date,
      petshotel.num_day,
      petshotel.appointment_id,
      pets.pet_name,
      petshotel.status
      FROM  petshotel
      join pets on petshotel.pet_id = pets.pet_id
      `;
      

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.json(results);
  });
})

app.post('/create-appointment', (req, res) => {
  const { owner_id, pet_id, type_service, personnel_id, detail_service, appointment_date, appointment_time, reason, status,queue_status } = req.body;

  try {
    // Generate appointment ID and insert into the database
    generateAppointmentID(db, type_service, (err, newAppointmentID) => {
      if (err) {
        console.error('Error generating appointment ID:', err);
        return res.status(500).json({ error: 'Error generating appointment ID' });
      }

      const insertQuery = `
        INSERT INTO appointment (appointment_id, owner_id, pet_id, personnel_id, detail_service, type_service, appointment_date, appointment_time, reason, status,queue_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)
      `;

      db.query(insertQuery, [newAppointmentID, owner_id, pet_id, personnel_id, detail_service, type_service, appointment_date, appointment_time, reason, status,queue_status], (err, result) => {
        if (err) {
          console.error('Error creating appointment:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ message: 'Appointment created successfully!', AppointmentID: newAppointmentID });
      });
    });

  } catch (error) {
    console.error('Unexpected error:', error.message);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// API to update the status of an appointment
app.post('/create-pet-hotel', (req, res) => {
  const { appointment_id, pet_id, entry_date, exit_date,num_day, pet_cage_id } = req.body;
  const petHotelStatus = '';
// 
  // const formatDateForDatabase = (dateString) => { 
    // const date = new Date(dateString);
    // const year = date.getFullYear();
    // const month = String(date.getMonth() + 1).padStart(2, '0');
    // const day = String(date.getDate()).padStart(2, '0');
    // return `${year}-${month}-${day}`;
  // };
// 
  // const formattedEntryDate = formatDateForDatabase(entry_date);
  // const formattedExitDate = formatDateForDatabase(exit_date);
  const insertPetHotelQuery = `
    INSERT INTO petshotel (appointment_id, pet_id, entry_date, exit_date,num_day, status,pet_cage_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(insertPetHotelQuery, [appointment_id, pet_id, entry_date, exit_date ,num_day, petHotelStatus,pet_cage_id], (err, result) => {
    if (err) {
      console.error('Error creating pet hotel entry:', err);
      return res.status(500).json({ error: 'Database error in creating pet hotel entry' });
    }

    res.json({
      message: 'Pet Hotel entry created successfully!',
      AppointmentID: appointment_id
    });
  });
});

app.delete('/deleted/appointment/:appointment_id', (req, res) => {
  const { appointment_id } = req.params;

  if (!appointment_id) {
    return res.status(400).json({ message: 'Invalid appointment ID' });
  }

  console.log("Deleting appointment with ID:", appointment_id);

  const deleteQuery = `
    DELETE a, p
    FROM appointment a
    LEFT JOIN petshotel p ON a.appointment_id = p.appointment_id
    WHERE a.appointment_id = ?`;

  db.query(deleteQuery, [appointment_id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete the appointment' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    return res.status(200).json({ message: 'Appointment deleted successfully' });
  });
});

app.use('/public', express.static(path.join(__dirname, '../../public')));


app.listen(8080, function () {
  console.log('Node app is running on port 8080' );
})
