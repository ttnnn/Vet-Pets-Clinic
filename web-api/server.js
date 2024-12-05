const express = require('express');
const { Pool } = require('pg'); 
const cors = require('cors');
const { generateAppointmentID } = require('./IdGenerator.js');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const app = express();
const { generateServiceID } = require('./generateServiceID.js'); 
require('./cronAppointment.js')

// Middleware
app.use(cors());
app.use(express.json()); 

// เชื่อมต่อกับ MySQL (จริง ๆ แล้วคือ PostgreSQL)
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT // ระบุพอร์ตหากจำเป็น (ค่าเริ่มต้นของ PostgreSQL คือ 5432)
});

// การเชื่อมต่อฐานข้อมูล
pool.connect()
  .then(() => console.log('เชื่อมต่อกับ PostgreSQL สำเร็จ'))
  .catch(err => console.error('การเชื่อมต่อ PostgreSQL ล้มเหลว', err));

app.get('/', function (req, res) {
  res.send('Hello World');
});

app.use('/public', express.static(path.join(__dirname, '../public')));  // **สำคัญ**: ตั้งเส้นทางให้ถูกต้อง



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../public/Images')); // save images in the 'uploads' folder
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
      spayed_neutered, 
      microchip_number, 
      pet_species 
  } = req.body;

  try {
      const result = await pool.query(
        'UPDATE pets SET owner_id = $1, pet_name = $2, pet_color = $3, pet_breed = $4, pet_gender = $5, pet_birthday = $6, spayed_neutered = $7, microchip_number = $8, pet_species = $9 WHERE pet_id = $10',
        [owner_id, pet_name, pet_color, pet_breed, pet_gender, pet_birthday, spayed_neutered, microchip_number, pet_species, id]
      );

      res.status(200).json({ message: 'Pet updated successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating pet' });
  }
});

app.put('/pets/:id/image', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const ImageUrl = req.file ? `/public/Images/${req.file.filename}` : null;

  try {
      const result = await pool.query(
          'UPDATE pets SET image_url = $1 WHERE pet_id = $2',
          [ImageUrl, id]
      );

      if (result.rowCount === 0) {
          return res.status(404).json({ message: 'Pet not found' });
      }

      res.status(200).json({ message: 'Pet image updated successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating pet image' });
  }
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
    pool.query(
      'UPDATE owner SET first_name = $1, last_name = $2, phone_number = $3, phone_emergency = $4, address = $5, province = $6, postal_code = $7 WHERE owner_id = $8',
      [first_name, last_name, phone_number, phone_emergency, address, province, postal_code, id]
    );

    res.status(200).json({ message: 'Owner updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating owner' });
  }
});

// Search for owners
app.get('/owners', async (req, res) => {
  const searchQuery = req.query.search || ''; // Receive search query
  const query = `SELECT * FROM owner WHERE CONCAT(first_name, ' ', last_name) ILIKE $1`;

  try {
      const results = await pool.query(query, [`%${searchQuery}%`]);
      res.json(results.rows); // Access `rows` to get the actual data
  } catch (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.get('/owners/:owner_id', async (req, res) => {
  console.log('/owners/:owner_id' , req.params)
  const { owner_id } = req.params; // Receive search query

  if (!owner_id || isNaN(Number(owner_id))) {
    return res.status(400).json({ error: 'Invalid owner ID' });
  }
  const query = `SELECT * FROM owner WHERE owner_id = $1`;

  try {
      const results = await pool.query(query, [owner_id]);
      res.json(results.rows); // Access `rows` to get the actual data
  } catch (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

//servicecategory
app.get('/servicecategory', async (req, res) => {
  console.log("/servicecategory", req.body);

  const query = `
    SELECT * FROM servicecategory
  `;

  try {
    const results = await pool.query(query);

    // แปลงผลลัพธ์เป็นอาร์เรย์ของหมวดหมู่บริการ
    const serviceCategories = results.rows;
    res.json(serviceCategories);
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.get('/vaccines', async (req, res) => {
  console.log("/vaccines", req.body);

  const query = `
    SELECT * FROM servicecategory WHERE category_type = 'รายการยา'
  `;

  try {
    const results = await pool.query(query);

    // แปลงผลลัพธ์เป็นอาร์เรย์ของหมวดหมู่บริการ
    const serviceCategories = results.rows;
    res.json(serviceCategories);
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/appointments/:appointmentId/vaccines', async (req, res) => {
  console.log('/appointments/:appointmentId/vaccines' , req.body )
  const { appointmentId } = req.params;
  const { pet_id, vaccine_id, notes } = req.body;

  const client = await pool.connect(); // เชื่อมต่อฐานข้อมูลด้วย client
  try {
    await client.query('BEGIN'); // เริ่มต้น transaction

    // 1. ตรวจสอบการมีอยู่ของ appointment
    const appointmentRes = await client.query(
      'SELECT * FROM appointment WHERE appointment_id = $1',
      [appointmentId]
    );
    if (appointmentRes.rows.length === 0) {
      throw new Error('Appointment not found');
    }

    // 2. ตรวจสอบการมีอยู่ของ vaccine
    const vaccineRes = await client.query(
      'SELECT * FROM servicecategory WHERE category_id = $1',
      [vaccine_id]
    );
    if (vaccineRes.rows.length === 0) {
      throw new Error('Vaccine not found');
    }

    // 3. เพิ่มข้อมูลลงใน history_vac_id
    await client.query(
      'INSERT INTO historyvaccine (appointment_id, category_id, pet_id, notes) VALUES ($1, $2, $3, $4)',
      [appointmentId, vaccine_id, pet_id, notes]
    );

    await client.query('COMMIT'); // ยืนยัน transaction

    res.status(200).json({ message: 'Vaccine added to appointment successfully' });
  } catch (error) {
    await client.query('ROLLBACK'); // ยกเลิก transaction ในกรณีที่มีข้อผิดพลาด
    console.error('Error while saving vaccine to appointment:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release(); // ปล่อย client
  }
});



// API Endpoint สำหรับสร้าง Service ID
app.post('/servicecategory', async (req, res) => {
  const { category_type, category_name, price_service } = req.body;

  console.log("data", req.body)


  if (!category_type || !category_name || !price_service) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const client = await pool.connect(); // เชื่อมต่อกับฐานข้อมูล
  try {
    await client.query('BEGIN'); // เริ่มต้น Transaction

    // เรียกฟังก์ชันในการสร้าง Service ID
    const newServiceID = await generateServiceID(pool, category_type); // ใช้ client แทน db

    // บันทึกข้อมูลในตาราง servicecategory
    const result = await client.query(
      'INSERT INTO servicecategory ( category_id, category_type, category_name, price_service) VALUES ($1, $2, $3, $4) RETURNING *',
      [ newServiceID, category_type, category_name, price_service]
    );

    // Commit transaction
    await client.query('COMMIT');

    // ส่งกลับข้อมูล Service ID ใหม่ที่บันทึกลงในฐานข้อมูล
    res.json({ category_id: newServiceID, service_category: result.rows[0] });

  } catch (error) {
    // Rollback transaction หากเกิดข้อผิดพลาด
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Failed to generate service ID and save category' });
  } finally {
    client.release(); // ปล่อยการเชื่อมต่อกลับ
  }
});

// DELETE /servicecategory/:id
app.delete('/servicecategory/:id', async (req, res) => {
  console.log('id', req.params)
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM servicecategory WHERE category_id = $1', [id]);
    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Deleted successfully' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PUT /servicecategory/:id
app.put('/servicecategory/:id', async (req, res) => {
  const { id } = req.params;
  const { category_type, category_name, price_service } = req.body;

  try {
    const result = await pool.query(
      'UPDATE servicecategory SET category_type = $1, category_name = $2, price_service = $3 WHERE category_id = $4',
      [category_type, category_name, price_service, id]
    );
    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Updated successfully' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});




// Fetch booked time slots for a specific date and service type
app.get('/appointments/booked-times', async (req, res) => {
  console.log("/appointments/booked-times", req.body);
  const { date, type_service } = req.query;

  if (!date || !type_service) {
    return res.status(400).json({ error: 'Date and service type are required' });
  }

  const query = `
    SELECT appointment_time 
    FROM appointment 
    WHERE appointment_date = $1 AND type_service = $2
  `;

  try {
    const results = await pool.query(query, [date, type_service]);

    // Map results to an array of booked time slots
    const bookedTimeSlots = results.rows.map(row => row.appointment_time);
    res.json(bookedTimeSlots);
  } catch (err) {
    console.error('Error fetching booked times:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/create-owner-pet', async (req, res) => {
  console.log("/create-owner-pet", req.body);
  const {
    owner: {
      first_name, 
      last_name, 
      phone_number, 
      phone_emergency, 
      address, 
      line_id,
      province, 
      postal_code
    },
    pets // Assume `pets` is an array of pet objects
  } = req.body;

  if (!first_name) {
    return res.status(400).json({ error: 'First name is required' });
  }

  const register_time = new Date();

  // Query strings
  const ownerQuery = `
    INSERT INTO owner (
      first_name, 
      last_name, 
      phone_number, 
      phone_emergency, 
      address, 
      line_id,
      province, 
      postal_code,
      register_time
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING owner_id
  `;

  const petQuery = `
    INSERT INTO pets (
      owner_id, 
      pet_name, 
      pet_color, 
      pet_breed, 
      pet_gender, 
      pet_birthday, 
      spayed_neutered, 
      microchip_number, 
      pet_species
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `;

  const client = await pool.connect(); // Start connection for transaction
  try {
    // Begin transaction
    await client.query('BEGIN');

    // Insert owner and get owner_id
    const ownerResult = await client.query(ownerQuery, [
      first_name, last_name, phone_number, phone_emergency, 
      address, line_id, province, postal_code, register_time
    ]);
    const owner_id = ownerResult.rows[0].owner_id;

    // Insert pets
    const petPromises = pets.map(pet => {
      const petValues = [
        owner_id, pet.pet_name, pet.pet_color, pet.pet_breed, 
        pet.pet_gender, pet.pet_birthday, pet.spayed_neutered, 
        pet.microchip_number, pet.pet_species
      ];
      return client.query(petQuery, petValues);
    });

    await Promise.all(petPromises);

    // Commit transaction
    await client.query('COMMIT');
    res.json({ owner_id });
  } catch (err) {
    // Rollback transaction in case of an error
    await client.query('ROLLBACK');
    console.error('Error during transaction:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    client.release(); // Release connection
  }
});


app.post('/pets', async (req, res) => {
  console.log("/pets", req.body); // Log request body

  const { 
    owner_id, 
    pet_name,
    pet_color,
    pet_breed,
    pet_gender, 
    pet_birthday, 
    spayed_neutered, 
    microchip_number, 
    pet_species 
  } = req.body;

  const sql  = `
  INSERT INTO pets (
    owner_id, 
    pet_name, 
    pet_color, 
    pet_breed, 
    pet_gender, 
    pet_birthday, 
    spayed_neutered, 
    microchip_number, 
    pet_species
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
`;

  try {
    const result = await pool.query(sql, [
      owner_id, pet_name, pet_color, pet_breed, pet_gender, 
      pet_birthday, spayed_neutered, microchip_number, 
      pet_species
    ]);

  } catch (err) {
    console.error('Error inserting pet:', err);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

app.put('/postpone/hotels/:id', async (req, res) => {
  console.log('/postpone/hotels/:id', req.params);
  const { id } = req.params;
  const { start_date, end_date, pet_cage_id, num_day, personnel_id } = req.body;

  if (!start_date || !end_date || !pet_cage_id || !personnel_id) {
    return res.status(400).send({ message: 'start_date, end_date, pet_cage_id, and personnel_id are required' });
  }

  // Start a transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Begin transaction

    // Update petshotel table
    const petHotelQuery = `
      UPDATE petshotel
      SET start_date = $1, end_date = $2, num_day = $3, pet_cage_id = $4
      WHERE appointment_id = $5
      RETURNING appointment_id
    `;

    const petHotelResult = await client.query(petHotelQuery, [
      start_date, end_date, num_day, pet_cage_id, id
    ]);

    if (petHotelResult.rowCount === 0) {
      await client.query('ROLLBACK'); // Rollback if petshotel not updated
      return res.status(404).send({ message: 'Pet hotel entry not found' });
    }

    // Update appointment table
    const appointmentQuery = `
      UPDATE appointment
      SET personnel_id = $1, appointment_date = $2
      WHERE appointment_id = $3
    `;

    await client.query(appointmentQuery, [personnel_id, start_date, id]);

    await client.query('COMMIT'); // Commit transaction

    return res.send({ message: 'Appointment status updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK'); // Rollback in case of error
    console.error('Failed to update appointment status:', err);
    res.status(500).send({ message: 'Database error' });
  } finally {
    client.release(); // Release the client
  }
});


app.post('/treatment/diagnosis', async (req, res) => {
  const { medicalData, diagnosisData, physicalData } = req.body;

  if (!medicalData || !diagnosisData || !physicalData) {
    return res.status(400).json({ message: 'Missing required data' });
  }

  const client = await pool.connect(); // Get a database client

  try {
    await client.query('BEGIN'); // Start transaction

    // Insert into the diagnosis table
    const diagnosisQuery = `
      INSERT INTO diagnosis (diag_cc, diag_ht, diag_pe, diag_majorproblem, diag_dx, diag_tentative, diag_final, diag_treatment, diag_client, diag_note)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING diagnosis_id 
    `;
    const diagnosisValues = [
      diagnosisData.diag_cc,
      diagnosisData.diag_ht,
      diagnosisData.diag_pe,
      diagnosisData.diag_majorproblem,
      diagnosisData.diag_dx,
      diagnosisData.diag_tentative,
      diagnosisData.diag_final,
      diagnosisData.diag_treatment,
      diagnosisData.diag_client,
      diagnosisData.diag_note,
    ];
    const diagnosisResult = await client.query(diagnosisQuery, diagnosisValues);
    const diagnosisId = diagnosisResult.rows[0].diagnosis_id;

    // Insert into the physical table
    const physicalQuery = `
      INSERT INTO physicalcheckexam (
        phy_general, phy_integumentary, phy_musculo_skeletal, phy_circulatory, phy_respiratory,
        phy_digestive, phy_genito_urinary, phy_eyes, phy_ears, phy_neural_system,
        phy_lymph_nodes, phy_mucous_membranes, phy_dental
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING physical_check_id
    `;
    const physicalValues = [
      physicalData.phy_general,
      physicalData.phy_integumentary,
      physicalData.phy_musculo_skeletal,
      physicalData.phy_circulatory,
      physicalData.phy_respiratory,
      physicalData.phy_digestive,
      physicalData.phy_genito_urinary,
      physicalData.phy_eyes,
      physicalData.phy_ears,
      physicalData.phy_neural_system,
      physicalData.phy_lymph_nodes,
      physicalData.phy_mucous_membranes,
      physicalData.phy_dental,
    ];
    const physicalResult = await client.query(physicalQuery, physicalValues);
    const physicalId = physicalResult.rows[0].physical_check_id;

    // Insert into the medical table
    const medicalQuery = `
      INSERT INTO medicalrecord (pet_id, rec_temperature, personnel_id, rec_pressure, rec_heartrate, rec_weight, rec_time, diagnosis_id, physical_check_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8 ,$9) RETURNING med_id
    `;
    const medicalValues = [
      medicalData.pet_id,
      medicalData.rec_temperature,
      medicalData.personnel_id,
      medicalData.rec_pressure,
      medicalData.rec_heartrate,
      medicalData.rec_weight,
      medicalData.rec_time,
      diagnosisId,
      physicalId
    ];
    const medicalResult = await client.query(medicalQuery, medicalValues);

    await client.query('COMMIT'); // Commit transaction
    res.status(201).json({
      message: 'Records saved successfully',
      medicalId: medicalResult.rows[0].med_id,
    });
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    console.error('Error during transaction:', error);
    res.status(500).json({ message: 'Failed to save records', error: error.message });
  } finally {
    client.release(); // Release the client back to the pool
  }
});





// Get pets by owner ID
app.get('/pets', async (req, res) => {
  const ownerId = req.query.owner_id;
  const query = `SELECT * FROM pets WHERE owner_id = $1`;

  try {
    const result = await pool.query(query, [ownerId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No pets found for this owner' });
    }
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get pet by pet_id
app.get('/pets/:pet_id', async (req, res) => {
  const pet_id = req.params.pet_id; // Get pet_id from req.params
  const query = `SELECT * FROM pets WHERE pet_id = $1`;

  try {
    const result = await pool.query(query, [pet_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No pets found with this pet ID' });
    }

    res.json(result.rows[0]); // Send the result as an object (first row)
  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get personnel details
app.get('/personnel', async (req, res) => {
  const query = `SELECT personnel_id, first_name, last_name, role FROM personnel`;

  try {
    const result = await pool.query(query);
    res.json(result.rows); // Return the result rows
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/appointment/:id', async (req, res) => {
  const { id } = req.params;
  const { status, queue_status } = req.body;

  console.log('Updating appointment with ID:', id);
  console.log('Received status:', status, 'queue_status:', queue_status);

  const client = await pool.connect();

  try {
    // Begin transaction
    await client.query('BEGIN');

    // Fetch current appointment details
    const currentQuery = `
      SELECT status, queue_status, type_service 
      FROM appointment 
      WHERE appointment_id = $1
    `;
    const currentResult = await client.query(currentQuery, [id]);

    if (currentResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).send({ message: 'Appointment not found' });
    }

    const { type_service } = currentResult.rows[0];

    // Check if type_service is 'ฝากเลี้ยง'
    if (type_service === 'ฝากเลี้ยง') {
      // Update pethotel status if status is provided
      if (status) {
        const petHotelUpdateQuery = `
          UPDATE petshotel 
          SET status = $1 
          WHERE appointment_id = $2
        `;
        const petHotelResult = await client.query(petHotelUpdateQuery, [status, id]);

        if (petHotelResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.status(400).send({ message: 'Failed to update PetHotel status. Cannot update queue.' });
        }
      }
    }

    // Update appointment table
    const appointmentUpdateQuery = `
      UPDATE appointment 
      SET queue_status = $1 , status = $2
      WHERE appointment_id = $3
    `;
    await client.query(appointmentUpdateQuery, [queue_status,status, id]);

    // Commit transaction
    await client.query('COMMIT');

    return res.send({ message: 'Appointment updated successfully' });
  } catch (err) {
    console.error('Failed to update appointment:', err);
    await client.query('ROLLBACK');
    return res.status(500).send({ message: 'Database error' });
  } finally {
    client.release();
  }
});


app.put('/postpone/appointment/:id', async (req, res) => {  
  const { id } = req.params;
  const { appointment_date, appointment_time } = req.body;
  console.log(`Updating appointment with ID: ${id}, date: ${appointment_date}, time: ${appointment_time}`);
  
  console.log('Updating appointment with ID:', id);
  console.log('Updating appointment date and time:', appointment_date, appointment_time);
  
  if (!appointment_date || !appointment_time) {
    return res.status(400).send({ message: 'appointment_date and appointment_time are required' });
  }

  const query = `
    UPDATE appointment 
    SET appointment_date = $1, appointment_time = $2 
    WHERE appointment_id = $3
  `;

  try {
    const result = await pool.query(query, [appointment_date, appointment_time, id]);

    if (result.rowCount === 0) {
      return res.status(404).send({ message: 'Appointment not found' });
    }

    return res.send({ message: 'Appointment date and time updated successfully' });
  } catch (err) {
    console.error('Failed to update appointment:', err);
    return res.status(500).send({ message: 'Database error' });
  }
});


app.get('/appointment', async (req, res) => {
  const query = `
    SELECT 
      appointment.appointment_id,
      appointment.status,
      appointment.appointment_date,
      appointment.appointment_time,
      pets.pet_name,
      pets.pet_id,
      pets.pet_birthday,
      pets.pet_gender,
      pets.pet_breed,
      pets.pet_species,
      pets.image_url,
      pets.spayed_neutered,
      owner.owner_id,
      owner.first_name || ' ' || owner.last_name AS full_name,  -- ใช้ || สำหรับการเชื่อมสตริง
      appointment.type_service,
      appointment.reason,
      appointment.detail_service,
      appointment.queue_status,
      medicalrecord.rec_weight,
      medicalrecord.med_id
    FROM appointment
    JOIN pets ON appointment.pet_id = pets.pet_id
    JOIN owner ON appointment.owner_id = owner.owner_id
    LEFT JOIN medicalrecord ON appointment.appointment_id = medicalrecord.appointment_id
  `;

  try {
    const result = await pool.query(query);
    res.json(result.rows);  // Return result rows as JSON
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/appointments/:appointmentId', async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const result = await pool.query('SELECT * FROM appointment WHERE appointment_id = $1', [appointmentId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/appointment/hotel', async (req, res) => {
  const query = `
    SELECT 
      appointment.appointment_id,
      appointment.status,
      appointment.detail_service,
      appointment.type_service,
      appointment.queue_status,
      pets.pet_name,
      pets.pet_id,
      pets.pet_species,
      owner.first_name || ' ' || owner.last_name AS full_name,  -- ใช้ || สำหรับการเชื่อมสตริง
      petshotel.start_date,
      petshotel.end_date,
      petshotel.num_day,
      petshotel.status As status_hotel,
      petshotel.pet_cage_id

    FROM appointment
    JOIN pets ON appointment.pet_id = pets.pet_id
    JOIN owner ON appointment.owner_id = owner.owner_id
    LEFT JOIN petshotel ON appointment.appointment_id = petshotel.appointment_id
    where appointment.type_service = 'ฝากเลี้ยง'
  `;

  try {
    const result = await pool.query(query);
    res.json(result.rows);  // Return result rows as JSON
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/create-appointment', async (req, res) => {
  console.log(req.body)
  const {
    pet_id,
    type_service,
    start_date,
    end_date,
    pet_cage_id,
  } = req.body;

  const client = await pool.connect(); // Connect to a client for the transaction

  try {
    await client.query('BEGIN'); // Start the transaction

    // Generate appointment ID
    const newAppointmentID = await generateAppointmentID(pool, type_service);
    console.log('newAppointmentID', newAppointmentID);


    // Create the appointment
    await createAppointment(client, newAppointmentID, req.body);

    // If type_service is 'ฝากเลี้ยง', create a PetHotel entry
    if (type_service === 'ฝากเลี้ยง') {
      await createPetHotelEntry(client, newAppointmentID, pet_id, start_date, end_date, pet_cage_id);
    }

    await client.query('COMMIT'); // Commit the transaction if all steps succeed
    res.status(201).json({ message: 'Appointment and PetHotel entry created successfully!', AppointmentID: newAppointmentID });

  } catch (error) {
    await client.query('ROLLBACK'); // Rollback the transaction if an error occurs
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  } finally {
    client.release(); // Release the client back to the Pool
  }
});

// Function to create a PetHotel entry within a transaction
async function createPetHotelEntry(client, newAppointmentID, pet_id, start_date, end_date, pet_cage_id) {
  const num_day = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24));
  try{
  const insertPetHotelQuery = `
    INSERT INTO petshotel (appointment_id, pet_id, start_date, end_date, num_day, status, pet_cage_id )
    VALUES ($1, $2, $3, $4, $5, 'รอเข้าพัก', $6)
  `;
  await client.query(insertPetHotelQuery, [newAppointmentID, pet_id, start_date, end_date, num_day, pet_cage_id]);

  const updateAppointmentDateQuery = `
  UPDATE appointment 
  SET appointment_date = $1 
  WHERE appointment_id = $2
`;
  await client.query(updateAppointmentDateQuery, [start_date, newAppointmentID]);
  }catch(error){
    console.error('Error in createAppointment:', error);
  }
  
}


// Function to create a general appointment within a transaction
async function createAppointment(client, newAppointmentID, data ) {
  const massage_status = 'pending'
  const { owner_id, pet_id, personnel_id, detail_service, type_service, appointment_date, appointment_time, reason, status, queue_status } = data;
  
  const insertQuery = `
    INSERT INTO appointment (appointment_id, owner_id, pet_id, personnel_id, 
    detail_service, type_service, appointment_date, 
    appointment_time, reason, status, queue_status , massage_status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 , $12)
  `;
  await client.query(insertQuery, [newAppointmentID, owner_id, pet_id, personnel_id, detail_service,
     type_service, appointment_date, appointment_time,
     reason, status, queue_status,massage_status]);
  // อัปเดตวันที่นัดหมายในตาราง appointment หลังสร้างการจองสำเร็จ
}


app.get('/available-cages', async (req, res) => {
  const { start_date, end_date, pet_species } = req.query;

  try {
    const { rows } = await pool.query(`
      SELECT 
        p.pet_cage_id, 
        p.cage_capacity, 
        COALESCE(COUNT(ph.pet_cage_id), 0) AS reserved_count
      FROM petcage p
      LEFT JOIN petshotel ph 
        ON p.pet_cage_id = ph.pet_cage_id 
        AND ($1::date BETWEEN ph.start_date AND ph.end_date 
             OR $2::date BETWEEN ph.start_date AND ph.end_date)
      WHERE p.pet_species = $3
      GROUP BY p.pet_cage_id, p.cage_capacity
      HAVING COALESCE(COUNT(ph.pet_cage_id), 0) < p.cage_capacity
    `, [start_date, end_date, pet_species]);

    res.json(rows);
  } catch (err) {
    console.error('Error fetching available cages:', err);
    res.status(500).json({ error: 'Database error fetching available cages' });
  }
});

app.post('/medical/symptom', async (req, res) => {
  console.log('/medical/symptom', req.body);
  const { appointment_id, rec_weight, diag_cc, pet_id, type_service } = req.body; // รับประเภทบริการด้วย

  const client = await pool.connect(); // ใช้ client สำหรับ transaction
  try {
    await client.query('BEGIN'); // เริ่ม transaction

    let diagnosis_id = null;

    // ตรวจสอบประเภทบริการ
    if (type_service === 'ตรวจรักษา') {  // ถ้าเป็นประเภทบริการ 'ตรวจรักษา' ให้บันทึก diagnosis_id
      // 1. บันทึกหรืออัปเดตข้อมูลในตาราง `diagno`
      const resultDiagno = await client.query(
        `INSERT INTO diagnosis (diag_cc) 
         VALUES ($1) 
         RETURNING diagnosis_id`,
        [diag_cc]
      );

      if (resultDiagno.rows.length > 0) {
        // หากเพิ่มข้อมูลใหม่ใน `diagno` ได้ ให้ใช้ id ที่เพิ่ม
        diagnosis_id = resultDiagno.rows[0].diagnosis_id;
      } else {
        // หาก diag_cc มีอยู่แล้ว ให้ค้นหา `diagno_id` ที่ตรงกัน
        const existingDiagno = await client.query(
          `SELECT diagnosis_id FROM diagnosis WHERE diag_cc = $1`,
          [diag_cc]
        );
        diagnosis_id = existingDiagno.rows[0].diagnosis_id;
      }
    }

    // 2. บันทึกหรืออัปเดตข้อมูลในตาราง `medicalrecord`
    await client.query(
      `INSERT INTO medicalrecord (appointment_id, pet_id, rec_weight, diagnosis_id) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (appointment_id, pet_id) 
       DO UPDATE SET rec_weight = $3, diagnosis_id = $4`,
      [appointment_id, pet_id, rec_weight, diagnosis_id]
    );

    await client.query('COMMIT'); // ยืนยัน transaction

    res.status(200).json({ message: 'Medical record saved successfully' });
  } catch (error) {
    await client.query('ROLLBACK'); // ย้อนกลับ transaction เมื่อเกิดข้อผิดพลาด
    console.error('Error saving medical record:', error);
    res.status(500).json({ error: 'Failed to save medical record' });
  } finally {
    client.release(); // ปล่อย client กลับสู่ pool
  }
});



// app.use('/public', express.static(path.join(__dirname, '../../public')));


app.listen(8080, function () {
  console.log('Node app is running on port 8080' );
})
