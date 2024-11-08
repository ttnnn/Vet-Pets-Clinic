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

// app.post('/reserveCage', (req, res) => { 
  // const { pet_cage_id, start_date, end_date } = req.body;
// 
  // Check if the cage is available for the selected dates
  // const checkAvailabilityQuery = `
    // SELECT * FROM petshotel 
    // WHERE pet_cage_id = ? 
      // AND ((? BETWEEN start_date AND end_date) 
      // OR (? BETWEEN start_date AND end_date))
  // `;
// 
  // db.query(checkAvailabilityQuery, [pet_cage_id, start_date, end_date], (err, result) => {
    // if (err) return res.status(500).json({ error: err.message });
// 
    // if (result.length > 0) {
      // return res.status(400).json({ message: 'Cage is already reserved for the selected date and time.' });
    // }
// 
    // });
  // });


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
      petshotel.start_date,
      petshotel.end_date,
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

app.post('/create-appointment',  async (req, res) => {
  const {
    pet_id,
    type_service,
    appointment_date,
    start_date,
    end_date,
    pet_cage_id
  } = req.body;

  try {
    // สร้าง appointment ID ตามประเภทบริการ
    const newAppointmentID = await  generateAppointmentID(db, type_service);
    console.log('newAppointmentID' , newAppointmentID)
    // ถ้าประเภทบริการเป็น "ฝากเลี้ยง" ให้ตรวจสอบกรงและสร้างการจอง PetHotel ก่อนการนัดหมาย
    if (type_service === 'ฝากเลี้ยง') {
      checkCageAvailability(start_date, end_date, pet_cage_id, async (isAvailable, error) => {
        if (error) {
          console.error('Error checking cage availability:', error);
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบกรง' });
        }

        if (!isAvailable) {
          return res.status(400).json({ error: 'กรงเต็มแล้วสำหรับช่วงวันที่ที่เลือก' });
        }
          await createAppointment(newAppointmentID, req.body, res);
        // หากกรงว่าง ทำการสร้างการจอง PetHotel
        createPetHotelEntry(newAppointmentID, pet_id, start_date, end_date, pet_cage_id, appointment_date, res);
      });
    } else {
      // สำหรับประเภทบริการอื่น ๆ สร้างการนัดหมายทันที
      createAppointment(newAppointmentID, req.body, res);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' });
  }
});

// ฟังก์ชันตรวจสอบความพร้อมของกรง
function checkCageAvailability(start_date, end_date, pet_cage_id, callback) {
  const checkAvailabilityQuery = `
    SELECT p.cage_capacity, COUNT(ph.pet_cage_id) AS reservedCount
    FROM petcage p
    LEFT JOIN petshotel ph ON p.pet_cage_id = ph.pet_cage_id 
      AND ((? BETWEEN ph.start_date AND ph.end_date) 
      OR (? BETWEEN ph.start_date AND ph.end_date))
    WHERE p.pet_cage_id = ?
    GROUP BY p.cage_capacity
  `;

  db.query(checkAvailabilityQuery, [start_date, end_date, pet_cage_id], (err, result) => {
    if (err) {
      return callback(false, err);
    }

    // ตรวจสอบว่ามีผลลัพธ์ใน result หรือไม่
    if (!result || result.length === 0) {
      // หากยังไม่มีการจองในกรงนี้ สามารถทำการจองได้ทันที
      return callback(true, null);
    }

    const { reservedCount, cage_capacity } = result[0];

    // ตรวจสอบว่าจำนวนการจองเกิน cage_capacity หรือไม่
    if (reservedCount >= cage_capacity) {
      return callback(false, null);
    }

    // กรงยังมีที่ว่าง
    callback(true, null);
  });
}

// ฟังก์ชันสำหรับสร้างการจอง PetHotel
function createPetHotelEntry(newAppointmentID, pet_id, start_date, end_date, pet_cage_id, res) {
  const num_day = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24));
  const insertPetHotelQuery = `
    INSERT INTO petshotel (appointment_id, pet_id, start_date, end_date, num_day, status, pet_cage_id)
    VALUES (?, ?, ?, ?, ?, 'จอง', ?)
  `;

  db.query(insertPetHotelQuery, [newAppointmentID, pet_id, start_date, end_date, num_day, pet_cage_id], (insertErr, insertResult) => {
    if (insertErr) {
      console.error('Error creating PetHotel entry:', insertErr);
      return res.status(500).json({ error: 'Database error in creating PetHotel entry' });
    }
   
    // อัปเดตวันที่นัดหมายในตาราง appointment หลังสร้างการจองสำเร็จ
    const updateAppointmentDateQuery = `UPDATE appointment SET appointment_date = ? WHERE appointment_id = ?`;
    db.query(updateAppointmentDateQuery, [start_date, newAppointmentID], (updateErr, updateResult) => {
      if (updateErr) {
        console.error('Error updating appointment date:', updateErr);
        return res.status(500).json({ error: 'Database error in updating appointment date' });
      }
    });
  });
}

// ฟังก์ชันสำหรับสร้างการนัดหมายทั่วไป
function createAppointment(newAppointmentID, data, res) {
  const { owner_id, pet_id, personnel_id, detail_service, type_service, appointment_date, appointment_time, reason, status, queue_status } = data;
  const insertQuery = `
    INSERT INTO appointment (appointment_id, owner_id, pet_id, personnel_id, detail_service, type_service, appointment_date, appointment_time, reason, status, queue_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(insertQuery, [newAppointmentID, owner_id, pet_id, personnel_id, detail_service, type_service, appointment_date, appointment_time, reason, status, queue_status], (err, result) => {
    if (err) {
      console.error('Error creating appointment:', err);
      return res.status(500).json({ error: 'Database error in creating appointment' });
    }

    res.json({ message: 'Appointment created successfully!', AppointmentID: newAppointmentID });
  });
}

app.use('/public', express.static(path.join(__dirname, '../../public')));


app.listen(8080, function () {
  console.log('Node app is running on port 8080' );
})
