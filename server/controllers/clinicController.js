const { generateAppointmentID } = require('../models/IdGenerator.js');
const { sendLineMessageWithImage } = require('../models/sendLineImage.js');
const {generateServiceID} = require('../models/generateServiceID.js'); 
const multer = require('multer');
const path = require('path');
const dayjs = require('dayjs');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); 
const crypto = require('crypto');
const sendLineMessage = require('../models/sendLineApprove.js');
const pool = require('../db.js');
router.use('/public', express.static(path.join(__dirname, '../../client/public')));  // **สำคัญ**: ตั้งเส้นทางให้ถูกต้อง
const cloudinary = require('../models/cloudinary'); 
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const jwt = require('jsonwebtoken');
const forgotPasswordRoute = require('../models/sendemail'); 
const secretKey = process.env.SECRET_KEY ;
require('dotenv').config();
const tokenExpiry = '1h'; // อายุของ Token

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
      folder: 'pets_images', // Change this to your desired Cloudinary folder
      allowed_formats: ['jpg', 'jpeg', 'png'], // Allowed file formats
  },
});
const authenticateUser = (req) => {
  const token = req.headers.authorization?.split(' ')[1]; 
  if (!token) return null;

  try {
    return jwt.verify(token, secretKey);
  } catch {
    return null;
  }
};
const upload = multer({ storage });
// เรียกใช้ API ใหม่
router.use('/auth', forgotPasswordRoute); // ใช้งาน API ที่ /api/auth/forgot-password

// Upload route
router.post('/uploads', upload.single('image'), (req, res) => {
  if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
  }
  res.status(200).json({ imageUrl: req.file.path });
});

// Update pet image route
router.put('/pets/:id/image', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const ImageUrl = req.file ? req.file.path : null; // Cloudinary's URL is in `req.file.path`

  try {
      const result = await pool.query(
          'UPDATE pets SET image_url = $1 WHERE pet_id = $2',
          [ImageUrl, id]
      );

      if (result.rowCount === 0) {
          return res.status(404).json({ message: 'Pet not found' });
      }

      res.status(200).json({ message: 'Pet image updated successfully', imageUrl: ImageUrl });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating pet image' });
  }
});


router.post('/send-line-message', async (req, res) => {
  const { lineUserId, message} = req.body;
  if (!lineUserId) {
    return res.status(400).json({ error: `lineUserId is required for appointment_id` });
  }

  try {
    const response = await sendLineMessage(lineUserId, message);
    res.status(200).json({ message: 'Message sent successfully', data: response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.get('/get-line-user/:appointmentId', async (req, res) => {
  const { appointmentId } = req.params;

  try {
    // Query เพื่อดึง line_id
    const query = `
      SELECT o.line_id
      FROM appointment a
      JOIN owner o ON a.owner_id = o.owner_id
      WHERE a.appointment_id = $1
    `;

    const result = await pool.query(query, [appointmentId]);

    if (result.rows.length > 0) {
      res.status(200).json({ lineUserId: result.rows[0].line_id });
    } else {
      res.status(404).json({ error: 'Line ID not found for the given appointment ID' });
    }
  } catch (error) {
    console.error('Error fetching line_id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/generate-signature', (req, res) => {
  const { timestamp, upload_preset } = req.body;

  if (!timestamp || !upload_preset) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const stringToSign = `timestamp=${timestamp}&upload_preset=${upload_preset}`;
  const signature = crypto
    .createHash('sha256')
    .update(stringToSign + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');

  res.status(200).json({
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
});


router.put('/pets/:id', async (req, res) => {
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
       await pool.query(
        'UPDATE pets SET owner_id = $1, pet_name = $2, pet_color = $3, pet_breed = $4, pet_gender = $5, pet_birthday = $6, spayed_neutered = $7, microchip_number = $8, pet_species = $9 WHERE pet_id = $10',
        [owner_id, pet_name, pet_color, pet_breed, pet_gender, pet_birthday, spayed_neutered, microchip_number, pet_species, id]
      );

      res.status(200).json({ message: 'Pet updated successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating pet' });
  }
});


router.put('/owners/:owner_id', (req, res) => {
  const { owner_id } = req.params; // Move this line up to avoid referencing id before it's declared.
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
      [first_name, last_name, phone_number, phone_emergency, address, province, postal_code, owner_id]
    );

    res.status(200).json({ message: 'Owner updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating owner' });
  }
});

// Search for owners
router.get('/owners', async (req, res) => {
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
router.get('/owners/:owner_id', async (req, res) => { // Log incoming request params
  const { owner_id } = req.params;

  // Validate owner_id
  if (!owner_id || isNaN(Number(owner_id))) {
    return res.status(400).json({ error: 'Invalid owner ID. Please provide a valid number.' });
  }

  const query = `SELECT * FROM owner WHERE owner_id = $1`;

  try {
    const results = await pool.query(query, [owner_id]);

    // Check if owner exists
    if (results.rows.length === 0) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    res.json(results.rows[0]); // Return the first (and only) row
  } catch (err) {
    console.error('Error executing query:', err.message || err);
    res.status(500).json({ error: 'An error occurred while fetching owner details' });
  }
});
router.get('/medical/form/:appointmentId', async (req, res) => {
 // Log incoming request params
  const { appointmentId } = req.params;

  if (!appointmentId) {
    return res.status(400).json({ error: 'Invalid appointmentId.' });
  }
  // JOIN query
  const query = `
    SELECT 
      mr.*,  
      d.*, 
      p.*,
      b.*
    FROM 
      medicalrecord AS mr
    LEFT JOIN  diagnosis AS d  ON mr.diagnosis_id = d.diagnosis_id
    LEFT JOIN physicalcheckexam AS p ON mr.physical_check_id = p.physical_check_id
    LEFT JOIN bodycondition AS b ON mr.appointment_id = b.appointment_id
    WHERE 
      mr.appointment_id = $1
  `;

  try {
    const results = await pool.query(query, [appointmentId]);

    if (results.rows.length === 0) {
      return res.status(404).json({ error: 'Medical record not found.' });
    }

    res.json(results.rows); // ส่งข้อมูลหลายแถว
  } catch (err) {
    console.error('Error executing query:', err.message || err);
    res.status(500).json({ error: 'An error occurred while fetching medical record details.' });
  }
});

//servicecategory
router.get('/servicecategory', async (req, res) => {
  const query = `
    SELECT * FROM servicecategory where active = 'true'
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
router.get('/vaccines', async (req, res) => {
  const query = `
    SELECT * FROM servicecategory WHERE category_type = 'รายการยา' and  active = 'true'
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

router.post('/appointment/vaccien', async (req, res) => {
  const { ids } = req.body;
  const query = `
    SELECT
      historyvaccine.appointment_id,
      servicecategory.category_name
    FROM historyvaccine
    LEFT JOIN servicecategory ON historyvaccine.category_id = servicecategory.category_id
    WHERE historyvaccine.appointment_id = ANY($1)
  `;
 //any ใช้กับ array
  try {
    const result = await pool.query(query, [ids]);
    res.json(result.rows); // ส่งข้อมูลกลับในรูปแบบ { appointment_id, category_name }  ตอบกลับข้อมูลหลายตัว
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post('/appointments/:appointmentId/vaccines', async (req, res) => {
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

    // 2. ตรวจสอบการมีอยู่ของวัคซีนหลายตัว
    for (const vaccineId of vaccine_id) {
      const vaccineRes = await client.query(
        'SELECT * FROM servicecategory WHERE category_id = $1 AND active = true',
        [vaccineId]
      );
      if (vaccineRes.rows.length === 0) {
        throw new Error(`Vaccine with id ${vaccineId} not found or inactive`);
      }
    }

    // 3. เพิ่มข้อมูลลงใน history_vac_id สำหรับวัคซีนแต่ละตัว
    const vaccineInsertPromises = vaccine_id.map(vaccineId => 
      client.query(
        'INSERT INTO historyvaccine (appointment_id, category_id, pet_id, notes) VALUES ($1, $2, $3, $4)',
        [appointmentId, vaccineId, pet_id, notes]
      )
    );

    await Promise.all(vaccineInsertPromises); // ใช้ Promise.all เพื่อรอให้ insert ทุกตัวเสร็จ

    await client.query('COMMIT'); // ยืนยัน transaction

    res.status(200).json({ message: 'Vaccines added to appointment successfully' });
  } catch (error) {
    await client.query('ROLLBACK'); // ยกเลิก transaction ในกรณีที่มีข้อผิดพลาด
    console.error('Error while saving vaccines to appointment:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release(); // ปล่อย client
  }
});

// API Endpoint สำหรับสร้าง Service ID
router.post('/servicecategory', async (req, res) => {
  const { category_type, category_name, price_service } = req.body;
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
router.delete('/servicecategory/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('UPDATE servicecategory SET active = FALSE WHERE category_id = $1', [id]);
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
router.put('/servicecategory/:id', async (req, res) => {
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
router.get('/appointments/booked-times', async (req, res) => {
  const { date, type_service } = req.query;

  if (!date || !type_service) {
    return res.status(400).json({ error: 'Date and service type are required' });
  }

  const query = `
    SELECT appointment_time 
    FROM appointment 
    WHERE appointment_date = $1 AND type_service = $2 AND  status != 'ยกเลิกนัด'
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

router.post('/create-owner-pet', async (req, res) => {
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


router.post('/pets', async (req, res) => {
  const { 
    owner_id, 
    pet_name,
    pet_color = null,
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
   await pool.query(sql, [
      owner_id, pet_name, pet_color || null, pet_breed, pet_gender, 
      pet_birthday, spayed_neutered, microchip_number, 
      pet_species
    ]);

  } catch (err) {
    console.error('Error inserting pet:', err);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

router.put('/postpone/hotels/:id', async (req, res) => {
  const { id } = req.params;
  const { start_date, end_date, pet_cage_id, num_day, personnel_id ,pet_id , status} = req.body;

  if (!start_date || !end_date || !pet_cage_id || !personnel_id) {
    return res.status(400).send({
      message: 'start_date, end_date, pet_cage_id, and personnel_id are required',
    });
  }


  // Start a transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Begin transaction

    // Check if entry exists in petshotel table
    const checkQuery = `
      SELECT appointment_id 
      FROM petshotel 
      WHERE appointment_id = $1
    `;
    const checkResult = await client.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      // Insert new entry if not found
      const insertQuery = `
        INSERT INTO petshotel (appointment_id, pet_id, start_date, end_date, num_day, pet_cage_id , status)
        VALUES ($1, $2, $3, $4, $5 ,$6 ,$7)
      `;
      await client.query(insertQuery, [id, pet_id, start_date, end_date, num_day, pet_cage_id , status]);
    } else {
      // Update existing entry if found
      const updateQuery = `
        UPDATE petshotel
        SET start_date = $1, end_date = $2, num_day = $3, pet_cage_id = $4
        WHERE appointment_id = $5
      `;
      await client.query(updateQuery, [start_date, end_date, num_day, pet_cage_id, id]);
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

router.post('/treatment/diagnosis', async (req, res) => {
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

    // Check if the appointment_id already exists
    const existingMedicalQuery = `
      SELECT med_id FROM medicalrecord WHERE appointment_id = $1
    `;
    const existingMedicalResult = await client.query(existingMedicalQuery, [medicalData.appointment_id]);

    let medicalResult;
    if (existingMedicalResult.rows.length > 0) {
      // If the appointment_id exists, update the record
      const updateMedicalQuery = `
        UPDATE medicalrecord
        SET pet_id = $1, rec_temperature = $2, personnel_id = $3, rec_pressure = $4, rec_heartrate = $5,
            rec_weight = $6, rec_time = $7, diagnosis_id = $8, physical_check_id = $9
        WHERE appointment_id = $10 RETURNING med_id
      `;
      const updateMedicalValues = [
        medicalData.pet_id,
        medicalData.rec_temperature,
        medicalData.personnel_id,
        medicalData.rec_pressure,
        medicalData.rec_heartrate,
        medicalData.rec_weight,
        medicalData.rec_time,
        diagnosisId,
        physicalId,
        medicalData.appointment_id, // We use appointment_id here
      ];
      medicalResult = await client.query(updateMedicalQuery, updateMedicalValues);
    } else {
      // If the appointment_id does not exist, insert a new record
      const insertMedicalQuery = `
        INSERT INTO medicalrecord (pet_id, rec_temperature, personnel_id, rec_pressure, rec_heartrate, rec_weight, rec_time, diagnosis_id, physical_check_id, appointment_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING med_id
      `;
      const insertMedicalValues = [
        medicalData.pet_id,
        medicalData.rec_temperature,
        medicalData.personnel_id,
        medicalData.rec_pressure,
        medicalData.rec_heartrate,
        medicalData.rec_weight,
        medicalData.rec_time,
        diagnosisId,
        physicalId,
        medicalData.appointment_id, // We use appointment_id here
      ];
      medicalResult = await client.query(insertMedicalQuery, insertMedicalValues);
    }

    await client.query('COMMIT'); // Commit transaction
    res.status(201).json({
      message: 'Records saved/updated successfully',
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
router.get('/pets', async (req, res) => {
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
router.get('/pets/:pet_id', async (req, res) => {
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
router.get('/personnel', async (req, res) => {
  const query = `SELECT personnel_id, first_name, last_name, role,user_name ,email FROM personnel where active = 'true'`;

  try {
    const result = await pool.query(query);
    res.json(result.rows); // Return the result rows
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.put('/appointment/:id', async (req, res) => {
  const { id } = req.params;
  const { status, queue_status, reason } = req.body;

  const client = await pool.connect();

  try {
    // Begin transaction
    await client.query('BEGIN');

    // Fetch current appointment details
    const currentQuery = `
      SELECT status, queue_status, type_service, reason
      FROM appointment 
      WHERE appointment_id = $1
    `;
    const currentResult = await client.query(currentQuery, [id]);

    if (currentResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).send({ message: 'Appointment not found' });
    }

    const { type_service, reason: currentReason } = currentResult.rows[0];

    // ตรวจสอบว่าเป็นบริการฝากเลี้ยงหรือไม่
    if (type_service === 'ฝากเลี้ยง') {
      let petHotelStatus = null;

      if (status === 'อนุมัติ') {
        petHotelStatus = 'checkin';
      } else if (status === 'ยกเลิกนัด') {
        petHotelStatus = 'cancle';
      }

      if (petHotelStatus) {
        const petHotelUpdateQuery = `
          UPDATE petshotel 
          SET status = $1 
          WHERE appointment_id = $2
        `;
        const petHotelResult = await client.query(petHotelUpdateQuery, [petHotelStatus, id]);

        if (petHotelResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.status(400).send({ message: 'Failed to update PetHotel status. Cannot update queue.' });
        }
      }
    }

    // ใช้ค่า reason เดิมหากไม่ได้ส่ง reason ใหม่มา
    const updatedReason = reason || currentReason;

    // อัปเดตตาราง appointment
    const appointmentUpdateQuery = `
      UPDATE appointment 
      SET queue_status = $1, status = $2, reason = $3
      WHERE appointment_id = $4
    `;
    await client.query(appointmentUpdateQuery, [queue_status, status, updatedReason, id]);

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


//เลื่อนนนัด
router.put('/postpone/appointment/:id', async (req, res) => {  
  const { id } = req.params;
  const { appointment_date, appointment_time } = req.body;
  
  if (!appointment_date) {
    return res.status(400).send({ message: 'appointment_date and appointment_time are required' });
  }

  const query = `
    UPDATE appointment 
    SET appointment_date = $1, appointment_time = $2 
    WHERE appointment_id = $3
  `;

  try {
    const result = await pool.query(query, [appointment_date, appointment_time || null, id]);

    if (result.rowCount === 0) {
      return res.status(404).send({ message: 'Appointment not found' });
    }

    return res.send({ message: 'Appointment date and time updated successfully' });
  } catch (err) {
    console.error('Failed to update appointment:', err);
    return res.status(500).send({ message: 'Database error' });
  }
});


router.get('/appointment', async (req, res) => {
  const query = `
    SELECT 
      appointment.appointment_id,
      appointment.status,
      appointment.appointment_date,
      appointment.appointment_time,
       appointment.massage_status,
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
      medicalrecord.med_id,
      medicalrecord.rec_time
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

router.get('/appointments/:appointmentId', async (req, res) => {
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

//ข้อมูลฝากเลี้ยง
router.get('/appointment/hotel', async (req, res) => {
  const query = `
    SELECT  appointment.appointment_id,
     appointment.status,
     appointment.detail_service,
     appointment.type_service,
     appointment.queue_status,
     pets.pet_name,
     pets.pet_id,
     pets.pet_species,
     owner.owner_id,
     owner.first_name || ' ' || owner.last_name AS full_name,  -- ใช้ || สำหรับการเชื่อมสตริง
     petshotel.start_date,
     petshotel.end_date,
     petshotel.num_day,
     petshotel.status As status_hotel,
     petshotel.pet_cage_id,
     personnel.first_name || ' ' || personnel.last_name AS personnel_name
   FROM appointment
   JOIN pets ON appointment.pet_id = pets.pet_id
   JOIN owner ON appointment.owner_id = owner.owner_id
   JOIN petshotel ON appointment.appointment_id = petshotel.appointment_id
   LEFT JOIN personnel ON appointment.personnel_id = personnel.personnel_id
   
   where appointment.type_service = 'ฝากเลี้ยง'  OR appointment.queue_status = 'admit'

  `;

  try {
    const result = await pool.query(query);
    res.json(result.rows);  // Return result rows as JSON
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



router.post('/create-appointment', async (req, res) => {
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
    // Create the appointment
    await createAppointment(client, newAppointmentID, req.body);

    // If type_service is 'ฝากเลี้ยง', create a PetHotel entry
    if (type_service === 'ฝากเลี้ยง') {
      await createPetHotelEntry(client, newAppointmentID, pet_id, start_date, end_date, pet_cage_id);
    }

    await client.query('COMMIT'); // Commit the transaction if all steps succeed
    // แจ้งเตือนไปยังคลินิกว่ามีการนัดหมายใหม่รออนุมัติ

    //  emitNewAppointment(pet_id, newAppointmentID)
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

//กรองกรง
router.get('/available-cages', async (req, res) => {
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

router.post('/medical/symptom', async (req, res) => {
  const { appointment_id, diag_cc, rec_weight, pet_id, type_service, ribs, subcutaneous_fat, abdomen, waist,result_bcs } = req.body;
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
    const rec_time = dayjs().format('YYYY-MM-DD HH:mm:ss'); 
    // 2. บันทึกหรืออัปเดตข้อมูลในตาราง `medicalrecord`
    await client.query(
      `INSERT INTO medicalrecord (appointment_id, pet_id, rec_weight, diagnosis_id,rec_time) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (appointment_id, pet_id) 
       DO UPDATE SET rec_weight = $3, diagnosis_id = $4 ,rec_time = $5`,
      [appointment_id, pet_id, rec_weight, diagnosis_id,rec_time]
    );

    // 3. บันทึกข้อมูลจาก DecisionTree ลงในตาราง `bodycondition`
    await client.query(
      `INSERT INTO bodycondition (pet_id, ribs, subcutaneous_fat, abdomen, waist, result_bcs, appointment_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (appointment_id, pet_id)
      DO UPDATE SET 
        ribs = EXCLUDED.ribs, 
        subcutaneous_fat = EXCLUDED.subcutaneous_fat, 
        abdomen = EXCLUDED.abdomen, 
        waist = EXCLUDED.waist, 
        result_bcs = EXCLUDED.result_bcs`,
      [pet_id, ribs, subcutaneous_fat, abdomen, waist, result_bcs, appointment_id]
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

router.get('/dayoff', async (req, res) => {

  const query = 'SELECT * FROM dayoff'; // Query to get all dayoff records
  try {
    const results = await pool.query(query); // Execute the query
    const dayOffRecords = results.rows; // Extract data from query result
    res.json(dayOffRecords); // Send data back as JSON
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Add New Day Off Record                                                                                                                                                                                                                                   

router.post('/dayoff', async (req, res) => {
  const { date_start,date_end, dayoff_note, dayoff_type, recurring_days} = req.body
  if (!date_start || !date_end || !dayoff_note || !dayoff_type || !recurring_days) {
    return res.status(400).json({ error: 'Dayoff date and note are required' });
  }

  const client = await pool.connect(); // Connect to database
  try {
    await client.query('BEGIN'); // Begin transaction

    // Insert new dayoff record into dayoff table
    const result = await client.query(
      'INSERT INTO dayoff (date_start, date_end, dayoff_note,  dayoff_type, recurring_days) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [date_start, date_end, dayoff_note,  dayoff_type, recurring_days]
    );

    await client.query('COMMIT'); // Commit transaction
    res.status(201).json(result.rows[0]);  // Send back the newly created record
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback if error occurs
    console.error(error);
    res.status(500).json({ error: 'Failed to add day off record' });
  } finally {
    client.release(); // Release the connection
  }
});

// Update Day Off Record
router.put('/dayoff/:id', async (req, res) => {
  const { id } = req.params;
  const { date_start, date_end, dayoff_note, dayoff_type, recurring_days } = req.body;

  try {
    const result = await pool.query(
      'UPDATE dayoff SET date_start = $1, date_end = $2 ,dayoff_note = $3, dayoff_type = $4, recurring_days = $5 WHERE dayoff_id = $6',
      [date_start, date_end, dayoff_note, dayoff_type, JSON.stringify(recurring_days), id]
    );
    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Updated successfully' });
    } else {
      res.status(404).json({ message: 'Day off not found' });
    }
  } catch (error) {
    console.error('Error updating day off record:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Delete Day Off Record
router.delete('/dayoff/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM dayoff WHERE dayoff_id = $1', [id]);
    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Deleted successfully' });
    } else {
      res.status(404).json({ message: 'Day off not found' });
    }
  } catch (error) {
    console.error('Error deleting day off record:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/admitrecord', async (req, res) => {
  const {
    admit_temp,
    admit_pressure,
    admit_heartrate,
    record_time,
    record_medical,
    record_medicine,
    appointment_id,
  } = req.body;
  // ตรวจสอบข้อมูลก่อนเพิ่ม
  if (!admit_temp || !record_medical || !appointment_id) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
  }

  try {
    const query = `
      INSERT INTO admitrecord (
        admit_temp, admit_pressure, admit_heartrate, record_time,
        record_medical, record_medicine, appointment_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      admit_temp,
      admit_pressure || null,
      admit_heartrate || null,
      record_time,
      record_medical,
      record_medicine || null,
      appointment_id,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: 'เพิ่มข้อมูลสำเร็จ',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล' });
  }
});

//ข้อมูล admit

router.get("/admitrecord", (req, res) => {
  const appointmentId = req.query.appointment_id; // รับค่าจาก query string
  
  if (!appointmentId) {
    return res.status(400).json({ error: "Appointment ID is required" });
  }

  const query = `SELECT * FROM admitrecord WHERE appointment_id = $1`; // ใช้ placeholder สำหรับค่าที่ปลอดภัย
  
  pool.query(query, [appointmentId], (err, results) => {
    if (err) {
      console.error("Database query error: ", err);
      return res.status(500).json({ error: "Failed to retrieve data" });
    }

    if (results.rows.length === 0) {
      return res.status(404).json({ message: "No admit record found for this appointment" });
    }

    return res.json({ data: results.rows });
  });
});

router.delete('/admitrecord/:recordId', async (req, res) => {
  const { recordId } = req.params;

  try {
    const result = await pool.query('DELETE FROM admitrecord WHERE admit_id = $1', [recordId]);

    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Record deleted successfully' });
    } else {
      res.status(404).json({ message: 'Record not found' });
    }
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/admitrecord/update', async (req, res) => { 
  const query = 
    'SELECT * FROM admitrecord'
  ;

  try {
    const results = await pool.query(query);

    // แปลงผลลัพธ์เป็นอาร์เรย์ของหมวดหมู่บริการ
    const personnel = results.rows;
    res.json(personnel);
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/personnel/change-password', async (req, res) => {
  const { user_name, oldPassword, newPassword } = req.body;

  if (!user_name || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  try {
    const userResult = await pool.query('SELECT password_encrip FROM personnel WHERE user_name = $1', [user_name]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
    }

    const validPassword = await bcrypt.compare(oldPassword, userResult.rows[0].password_encrip);

    if (!validPassword) {
      return res.status(401).json({ error: 'รหัสผ่านเก่าไม่ถูกต้อง' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE personnel SET password_encrip = $1 WHERE user_name = $2', [hashedPassword, user_name]);

    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
  }
});

router.post('/personnel', async (req, res) => {
  
  const { first_name, last_name, user_name, password_encrip, role , email } = req.body;
  let client; // Declare client outside the try block

  try {

    client = await pool.connect(); // เชื่อมต่อกับฐานข้อมูล
    await client.query('BEGIN'); // เริ่มต้น Transaction

     // ตรวจสอบว่ามี user_name ซ้ำในฐานข้อมูลหรือไม่
     const existingUser = await client.query('SELECT * FROM personnel WHERE user_name = $1', [user_name]);

     if (existingUser.rows.length > 0) {
       await client.query('ROLLBACK'); // ยกเลิก Transaction
       return res.status(400).json({ error: 'ชื่อผู้ใช้นี้มีอยู่แล้วในระบบ' });
     }

    const hashedPassword = await bcrypt.hash(password_encrip, 10); // ตรวจสอบว่า 10 ตรงกันในทุกการเข้ารหัส

    // บันทึกข้อมูลในตาราง personnel
    const result = await client.query(
      'INSERT INTO personnel (first_name, last_name, user_name, password_encrip, role,email) VALUES ($1, $2, $3, $4, $5 ,$6) RETURNING *',
      [first_name, last_name, user_name, hashedPassword, role , email]
    );

    await client.query('COMMIT'); // Commit transaction
    res.status(201).json(result.rows[0]); // ส่งข้อมูลกลับในรูป JSON
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK'); // Rollback transaction หากเกิดข้อผิดพลาด
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to create personnel' });
  } finally {
    if (client) {
      client.release(); // ปล่อยการเชื่อมต่อกลับ
    }
  }
});


router.get('/personnel', async (req, res) => { 

  const query = 
   `SELECT * FROM personnel where active = 'true'`
  ;

  try {
    const results = await pool.query(query);

    // แปลงผลลัพธ์เป็นอาร์เรย์ของหมวดหมู่บริการ
    const personnel = results.rows;
    res.json(personnel);
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.get('/personnel/:username', async (req, res) => {
  const { username } = req.params;
  const query = `SELECT * FROM personnel WHERE user_name = $1 AND active = true`;

  try {
    const results = await pool.query(query, [username]);
    res.json(results.rows); // ส่งผลลัพธ์กลับไปยัง Frontend
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



router.delete('/personnel/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('UPDATE personnel SET active = FALSE WHERE personnel_id = $1', [id]);
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

router.put('/personnel/:id', async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, user_name, role, email } = req.body;

  const user = authenticateUser(req); // ตรวจสอบ Token
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  if (user.user_id !== parseInt(id)) {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์ในการแก้ไขข้อมูล' });
  }

  try {
    const client = await pool.connect(); // เชื่อมต่อฐานข้อมูล

    //  ตรวจสอบว่า user_name ซ้ำหรือไม่ (ยกเว้นตัวเอง)
    const existingUser = await client.query(
      'SELECT * FROM personnel WHERE user_name = $1 AND personnel_id <> $2',
      [user_name, id]
    );

    if (existingUser.rows.length > 0) {
      client.release();
      return res.status(400).json({ message: 'ชื่อผู้ใช้นี้มีอยู่แล้วในระบบ' });
    }

    // อัปเดตข้อมูล personnel
    const result = await client.query(
      'UPDATE personnel SET first_name = $1, last_name = $2, user_name = $3, role = $4, email = $5 WHERE personnel_id = $6',
      [first_name, last_name, user_name, role, email, id]
    );

    client.release(); // ปล่อยการเชื่อมต่อ

    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Updated successfully' });
    } else {
      res.status(404).json({ message: 'Personnel not found' });
    }
  } catch (error) {
    console.error('Error updating personnel:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.get('/history/vaccine/:appointment_id', async (req, res) => {
  const appointment_id = req.params.appointment_id; // Get pet_id from req.params
  const query = `SELECT historyvaccine.category_id ,
                  historyvaccine.notes ,
                  servicecategory.category_name , 
                  servicecategory.price_service FROM historyvaccine
                  JOIN servicecategory on  servicecategory.category_id = historyvaccine.category_id
                  WHERE appointment_id = $1`;

  try {
    const result = await pool.query(query, [appointment_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No found ' });
    }

    // res.json(result.rows[0]); // Send the result as an object (first row)
    res.json(result.rows); // Sends all rows as an array

  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/appointment/hotel/:appointment_id', async (req, res) => {
  const appointment_id = req.params.appointment_id;
  const query = `
    SELECT 
      appointment.appointment_id,
      petshotel.start_date,
      petshotel.end_date,
      petshotel.num_day,
      petshotel.status AS status_hotel,
      petshotel.pet_cage_id,
      admitrecord.record_medicine,
      personnel.first_name || ' ' || personnel.last_name AS personnel_name,
      CASE 
        WHEN petshotel.end_date < CURRENT_DATE THEN CURRENT_DATE - petshotel.end_date
        ELSE 0
      END AS days_overdue
    FROM appointment
    LEFT JOIN personnel ON appointment.personnel_id = personnel.personnel_id
    LEFT JOIN petshotel ON appointment.appointment_id = petshotel.appointment_id
    LEFT JOIN admitrecord ON appointment.appointment_id = admitrecord.appointment_id
    WHERE appointment.appointment_id = $1
  `;

  try {
    const result = await pool.query(query, [appointment_id]);
    res.json(result.rows); // Return result rows as JSON
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/create-invoice', async (req, res) => {
  const {
    appointmentId,
    selectedItems,
    totalAmount,
  } = req.body;

  const client = await pool.connect(); // Connect to database

  try {
    // 1. บันทึกการชำระเงิน
    const paymentQuery = 'INSERT INTO payment (total_payment, payment_date, status_pay) VALUES ($1, $2, $3) RETURNING payment_id';
    const paymentResult = await client.query(paymentQuery, [totalAmount, new Date(), 'pending']);
    const paymentId = paymentResult.rows[0].payment_id;

    // 2. บันทึกใบเสร็จ
    const invoiceQuery = 'INSERT INTO invoice (payment_id, appointment_id, invoice_date, total_pay_invoice) VALUES ($1, $2, $3, $4) RETURNING invoice_id';
    const invoiceResult = await client.query(invoiceQuery, [paymentId, appointmentId, new Date(), totalAmount]);
    const invoiceId = invoiceResult.rows[0].invoice_id;

    // 3. บันทึกรายการสินค้า
    for (const item of selectedItems) {
      const serviceInvoiceQuery = 'INSERT INTO serviceinvoice (invoice_id, category_id, amount, subtotal_price) VALUES ($1, $2, $3, $4)';
      await client.query(serviceInvoiceQuery, [invoiceId, item.category_id, item.amount, item.amount * item.price_service]);
    }

    // 4. อัปเดตสถานะคิว (appointment)
    const updateAppointmentQuery = 'UPDATE appointment SET  queue_status = $1 WHERE appointment_id = $2';
    await client.query(updateAppointmentQuery, ['รอชำระเงิน', appointmentId]);

    await client.query('COMMIT'); // ยืนยันการทำ transaction
    res.status(200).json({ status: 'success', message: 'ข้อมูลถูกบันทึกสำเร็จ' });
  } catch (error) {
    await client.query('ROLLBACK'); // ยกเลิก transaction หากเกิดข้อผิดพลาด
    console.error('Error during transaction:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  }
});


router.get('/medical/invoice/:appointment_id', async (req, res) => {
  const appointment_id = req.params.appointment_id;
  const query = `
      SELECT 
      appointment.appointment_id,
      petshotel.start_date,
      petshotel.end_date,
      petshotel.num_day,
      servicecategory.category_name,
      servicecategory.price_service,
      serviceinvoice.amount,
      serviceinvoice.invoice_id,
      serviceinvoice.category_id,
      invoice.total_pay_invoice,
   
      CASE 
        WHEN petshotel.end_date < CURRENT_DATE THEN CURRENT_DATE - petshotel.end_date
        ELSE 0
      END AS days_overdue
   
    FROM appointment
    INNER JOIN invoice ON appointment.appointment_id = invoice.appointment_id
    INNER JOIN serviceinvoice ON invoice.invoice_id = serviceinvoice.invoice_id
    LEFT JOIN servicecategory ON serviceinvoice.category_id = servicecategory.category_id 
    LEFT JOIN petshotel ON appointment.appointment_id = petshotel.appointment_id
   
    WHERE appointment.appointment_id = $1
  `;

  try {
    const result = await pool.query(query, [appointment_id]);
    res.json(result.rows); // Return result rows as JSON
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/delete/item/:category_id/:invoice_id', async (req, res) => {
  const { category_id, invoice_id } = req.params;
  const client = await pool.connect(); // เชื่อมต่อ Client เพื่อใช้ Transaction

  try {
    await client.query('BEGIN'); // เริ่ม Transaction

    // 1. ลบรายการสินค้า
    await client.query('DELETE FROM serviceinvoice WHERE category_id = $1 AND invoice_id = $2', [category_id, invoice_id]);

    // 2. รวมราคาสินค้าที่ยังเหลือ
    const result = await client.query(
      'SELECT SUM(subtotal_price) AS total FROM serviceinvoice WHERE invoice_id = $1',
      [invoice_id]
    );
    const totalPrice = result.rows[0].total || 0;

    // 3. อัปเดตราคาในตาราง invoice
    await client.query('UPDATE invoice SET total_pay_invoice = $1 WHERE invoice_id = $2', [totalPrice, invoice_id]);

    // 4. อัปเดตราคาในตาราง payment
    await client.query(
      'UPDATE payment SET total_payment = $1 WHERE payment_id = (SELECT payment_id FROM invoice WHERE invoice_id = $2)',
      [totalPrice, invoice_id]
    );

    await client.query('COMMIT'); // ยืนยันการเปลี่ยนแปลง
    res.status(200).json({ message: 'Item deleted and invoice updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK'); // ยกเลิกการเปลี่ยนแปลงทั้งหมด
    console.error('Error during transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release(); // ปิดการเชื่อมต่อ
  }
});

router.post('/create-invoice/payment', async (req, res) => {
  const {
    appointmentId,
    selectedItems,
    totalAmount,
  } = req.body;

  const client = await pool.connect(); // Connect to database

  try {
    await client.query('BEGIN'); // เริ่ม transaction

    // ตรวจสอบว่า appointment_id มีอยู่ในฐานข้อมูลหรือไม่
    const existingInvoiceQuery = 'SELECT invoice_id FROM invoice WHERE appointment_id = $1';
    const existingInvoiceResult = await client.query(existingInvoiceQuery, [appointmentId]);

    let invoiceId;
    let paymentId;

    if (existingInvoiceResult.rowCount > 0) {
      // มีข้อมูล invoice เดิม -> อัปเดตข้อมูล
      invoiceId = existingInvoiceResult.rows[0].invoice_id;

      const updateInvoiceQuery = 'UPDATE invoice SET total_pay_invoice = $1, invoice_date = $2 WHERE invoice_id = $3';
      await client.query(updateInvoiceQuery, [totalAmount, new Date(), invoiceId]);

      // ดึง payment_id ที่เกี่ยวข้องกับ invoice
      const paymentQuery = 'SELECT payment_id FROM invoice WHERE invoice_id = $1';
      const paymentResult = await client.query(paymentQuery, [invoiceId]);
      paymentId = paymentResult.rows[0].payment_id;

      const updatePaymentQuery = 'UPDATE payment SET total_payment = $1, payment_date = $2 , status_pay = $3  WHERE payment_id = $4';
      await client.query(updatePaymentQuery, [totalAmount, new Date(),'Paid',paymentId]);
    } else {
      // ไม่มีข้อมูล -> สร้างใหม่
      const paymentQuery = 'INSERT INTO payment (total_payment, payment_date, status_pay) VALUES ($1, $2, $3) RETURNING payment_id';
      const paymentResult = await client.query(paymentQuery, [totalAmount, new Date(), 'Paid']);
      paymentId = paymentResult.rows[0].payment_id;

      const invoiceQuery = 'INSERT INTO invoice (payment_id, appointment_id, invoice_date, total_pay_invoice) VALUES ($1, $2, $3, $4) RETURNING invoice_id';
      const invoiceResult = await client.query(invoiceQuery, [paymentId, appointmentId, new Date(), totalAmount]);
      invoiceId = invoiceResult.rows[0].invoice_id;
    }
    // อัปเดตรายการสินค้า
    for (const item of selectedItems) {
      const checkServiceInvoiceQuery = 'SELECT * FROM serviceinvoice WHERE invoice_id = $1 AND category_id = $2';
      const serviceInvoiceResult = await client.query(checkServiceInvoiceQuery, [invoiceId, item.category_id]);

      if (serviceInvoiceResult.rowCount > 0) {
        // มีรายการสินค้าซ้ำ -> อัปเดต
        const updateServiceInvoiceQuery = `
          UPDATE serviceinvoice 
          SET amount = $1, subtotal_price = $2 
          WHERE invoice_id = $3 AND category_id = $4
        `;
        await client.query(updateServiceInvoiceQuery, [
          item.amount,
          item.amount * item.price_service,
          invoiceId,
          item.category_id,
        ]);
      } else {
        // ไม่มี -> สร้างใหม่
        const insertServiceInvoiceQuery = `
          INSERT INTO serviceinvoice (invoice_id, category_id, amount, subtotal_price) 
          VALUES ($1, $2, $3, $4)
        `;
        await client.query(insertServiceInvoiceQuery, [
          invoiceId,
          item.category_id,
          item.amount,
          item.amount * item.price_service,
        ]);
      }
    }

    // อัปเดตสถานะคิว (appointment)
    const updateAppointmentQuery = 'UPDATE appointment SET queue_status = $1 WHERE appointment_id = $2';
    const updateHotelStatusQuery = 'UPDATE petshotel SET status = $1 WHERE appointment_id = $2';
    await client.query(updateAppointmentQuery, ['เสร็จสิ้น', appointmentId]);

    const checkHotelStatusQuery = 'SELECT status FROM petshotel WHERE appointment_id = $1';
    const hotelResult = await client.query(checkHotelStatusQuery, [appointmentId]);

  if (hotelResult.rows.length > 0) {
    await client.query(updateHotelStatusQuery, ['checkout', appointmentId]);
  }


    await client.query('COMMIT'); // ยืนยัน transaction
    res.status(200).json({ status: 'success', message: 'ข้อมูลถูกบันทึกสำเร็จ' , invoice_id: invoiceId ,payment_id: paymentId});
  } catch (error) {
    await client.query('ROLLBACK'); // ยกเลิก transaction หากเกิดข้อผิดพลาด
    console.error('Error during transaction:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  } finally {
    client.release();
  }
});

router.get('/history/medical/:appointmentId', async (req, res) => {
  const { appointmentId } = req.params;
  const client = await pool.connect(); // เชื่อมต่อฐานข้อมูล

  try {
    const query = `
      SELECT 
        m.med_id,
        m.pet_id,
        m.appointment_id,
        m.rec_temperature,
        m.rec_pressure,
        m.rec_heartrate,
        m.rec_weight,
        m.rec_time,
        d.diagnosis_id,
        d.diag_cc,
        d.diag_ht,
        d.diag_pe,
        d.diag_majorproblem,
        d.diag_dx,
        d.diag_tentative,
        d.diag_final,
        d.diag_treatment,
        d.diag_client,
        d.diag_note,
        p.physical_check_id,
        p.phy_general,
        p.phy_integumentary,
        p.phy_musculo_skeletal,
        p.phy_circulatory,
        p.phy_respiratory,
        p.phy_digestive,
        p.phy_genito_urinary,
        p.phy_eyes,
        p.phy_ears,
        p.phy_neural_system,
        p.phy_lymph_nodes,
        p.phy_mucous_membranes,
        p.phy_dental,
        pets.pet_name,
        personnel.first_name || ' ' || personnel.last_name AS personnel_name ,
        owner.owner_id,
        owner.first_name || ' ' || owner.last_name AS owner_name
      FROM medicalrecord m
      LEFT JOIN pets ON m.pet_id = pets.pet_id
      LEFT JOIN owner ON pets.owner_id = owner.owner_id 
      LEFT JOIN personnel ON  m.personnel_id = personnel.personnel_id
      LEFT JOIN diagnosis d ON m.diagnosis_id = d.diagnosis_id
      LEFT JOIN physicalcheckexam p ON m.physical_check_id = p.physical_check_id
      WHERE m.appointment_id = $1
    `;
    const result = await client.query(query, [appointmentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No records found for the given appointment ID' });
    }

    res.status(200).json(result.rows[0]); // ส่งข้อมูลกลับในรูป JSON
  } catch (error) {
    console.error('Error fetching treatment details:', error);
    res.status(500).json({ message: 'Failed to fetch treatment details', error: error.message });
  } finally {
    client.release(); // ปล่อย connection กลับสู่ pool
  }
});


router.get('/finance', async (req, res) => {
  const client = await pool.connect(); // เชื่อมต่อฐานข้อมูล
  try {
    const query = `
      SELECT 
      i.*,
      pay.*,
      owner.first_name ||' ' || owner.last_name AS fullname,
      a.queue_status

      FROM invoice i
      LEFT JOIN appointment a  ON i.appointment_id = a.appointment_id
      LEFT JOIN owner ON a.owner_id = owner.owner_id 
      LEFT JOIN payment pay ON i.payment_id = pay.payment_id
   
    `;
    const result = await client.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No records found for the given appointment ID' });
    }

    res.status(200).json(result.rows); // ส่งข้อมูลกลับในรูป JSON
  } catch (error) {
    console.error('Error fetching treatment details:', error);
    res.status(500).json({ message: 'Failed to fetch treatment details', error: error.message });
  } finally {
    client.release(); // ปล่อย connection กลับสู่ pool
  }
});
router.get('/product/receipt/:invoice_Id', async (req, res) => {
  const { invoice_Id } = req.params; // ใช้ invoice_Id ให้ตรงกับ route
  const client = await pool.connect(); // เชื่อมต่อฐานข้อมูล
  try {
    const query = `
      SELECT 
      i.invoice_id,
      i.appointment_id,
      pay.*,
      owner.first_name ||' ' || owner.last_name AS fullname,
      s.*,
      c.category_name,
      owner.line_id

      FROM invoice i
      LEFT JOIN appointment a  ON i.appointment_id = a.appointment_id
      LEFT JOIN owner ON a.owner_id = owner.owner_id 
      LEFT JOIN payment pay ON i.payment_id = pay.payment_id
      LEFT JOIN serviceinvoice s ON s.invoice_id = i.invoice_id
      LEFT JOIN servicecategory c ON c.category_id = s.category_id

      WHERE i.invoice_id = $1
   
    `;
    const result = await client.query(query,[invoice_Id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No records found for the given appointment ID' });
    }

    res.status(200).json(result.rows); // ส่งข้อมูลกลับในรูป JSON
  } catch (error) {
    console.error('Error fetching treatment details:', error);
    res.status(500).json({ message: 'Failed to fetch treatment details', error: error.message });
  } finally {
    client.release(); // ปล่อย connection กลับสู่ pool
  }
});

router.get('/dashboard', async (req, res) => {  
  try {
    let { petType = 0, timeFilter = 'year', year } = req.query; 

    if (!year) {
      year = new Date().getFullYear().toString();
    }
    
    let petTypeCondition = '';
    let queryParams = [];
    
    switch (parseInt(petType, 10)) {
      case 1: // 1 คือ สุนัข
        petTypeCondition = `AND p.pet_species = $1`;
        queryParams.push('สุนัข');
        break;
      case 2: // 2 คือ แมว
        petTypeCondition = `AND p.pet_species = $1`;
        queryParams.push('แมว');
        break;
      case 3: // 3 คือ อื่นๆ
        petTypeCondition = `AND p.pet_species NOT IN ($1, $2)`;
        queryParams.push('สุนัข', 'แมว');
        break;
      default: // 0 คือ ทั้งหมด
        petTypeCondition = '';
        break;
    }

    let timeCondition = '1=1';
    const parsedYear = parseInt(year, 10);
    
    if (timeFilter === 'month') {
      timeCondition = `EXTRACT(MONTH FROM appointment_date) = EXTRACT(MONTH FROM CURRENT_DATE) 
                       AND EXTRACT(YEAR FROM appointment_date) = $${queryParams.length + 1}`;
      queryParams.push(parsedYear);
    } else {
      timeCondition = `EXTRACT(YEAR FROM appointment_date) = $${queryParams.length + 1}`;
      queryParams.push(parsedYear);
    }

    const statusCondition = "AND COALESCE(a.status, '') = 'อนุมัติ' AND COALESCE(a.queue_status, '') = 'เสร็จสิ้น'";

    //console.log('Query Params Before Query:', queryParams);

    // ดึงข้อมูลประเภทบริการ
    const resultServices = await pool.query(`
      SELECT type_service AS type, COUNT(*) AS count 
      FROM appointment a
      LEFT JOIN pets p ON a.pet_id = p.pet_id  
      WHERE ${timeCondition} ${petTypeCondition} ${statusCondition}
      GROUP BY type_service
    `, queryParams);

    const services = resultServices.rows;

    //  ดึงจำนวนสัตว์เข้าใช้บริการในแต่ละเดือน/วัน
    const resultPetsPerPeriod = await pool.query(`
      SELECT 
        ${timeFilter === 'month' 
          ? 'EXTRACT(DAY FROM appointment_date) AS period' 
          : 'EXTRACT(MONTH FROM appointment_date) AS period'},
        COUNT(a.pet_id) AS count
      FROM appointment a
      LEFT JOIN pets p ON a.pet_id = p.pet_id 
      WHERE ${timeCondition} ${petTypeCondition} ${statusCondition}
      GROUP BY period
      ORDER BY period
    `, queryParams);
    
    const petsPerPeriod = resultPetsPerPeriod.rows; 

    // ดึงรายได้ตามช่วงเวลา
    
    const resultRevenue = await pool.query(`
      SELECT 
        EXTRACT(MONTH FROM pay.payment_date) AS period,
        SUM(pay.total_payment) AS amount
      FROM appointment a
      INNER JOIN invoice ON a.appointment_id = invoice.appointment_id
      INNER JOIN payment pay ON pay.payment_id = invoice.payment_id
      INNER JOIN pets p ON a.pet_id = p.pet_id 
      WHERE EXTRACT(YEAR FROM pay.payment_date) = $1 
      ${petTypeCondition} ${statusCondition}
      GROUP BY period
      ORDER BY period
    `, [parsedYear]);
    
    const revenue = resultRevenue.rows;
    
    res.json({ services, petsPerPeriod, revenue });

  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving dashboard data');
  }
});  

router.get('/available-years', async (req, res) => {
  try {
    // Query ดึงปีที่มีข้อมูลจากตาราง appointments
    const result = await pool.query(`
      SELECT DISTINCT EXTRACT(YEAR FROM appointment_date) AS year
      FROM appointment
      ORDER BY year DESC
    `);

    // เช็คว่า result.rows มีข้อมูลหรือไม่
    const years = result.rows.map(row => row.year);

    // ส่งข้อมูลปีกลับไปในรูป JSON
    res.json({ years });
  } catch (error) {
    console.error('Error fetching available years:', error);
    res.status(500).send('Error fetching available years');
  }
});

router.post('/sendLineReceipt', async (req, res) => {
  const { lineId, imageUrl } = req.body; // เปลี่ยนจาก imageBase64 เป็น imageUrl

  if (!lineId || !imageUrl) {
    return res.status(400).json({ error: 'Missing required data' });
  }

  try {
    await sendLineMessageWithImage(lineId, imageUrl); // ส่งข้อความพร้อมรูปภาพจาก URL ไปยัง LINE
    res.status(200).json({ message: 'Receipt sent to LINE successfully' });
  } catch (error) {
    console.error('Error sending receipt to LINE:', error);
    res.status(500).json({ error: 'Failed to send receipt to LINE' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM personnel WHERE user_name = $1 LIMIT 1', [username]);
    client.release();

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // เช็คว่าค่ารหัสผ่านจากฐานข้อมูลเป็น null หรือ undefined หรือไม่
    if (!user.password_encrip) {
      console.error("Error: Password hash not found in database");
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // เปรียบเทียบรหัสผ่าน
    const isPasswordMatch = await bcrypt.compare(password, user.password_encrip);

    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // สร้าง JWT Token
    const token = jwt.sign(
      {
        user_id: user.personnel_id,
        username: user.user_name,
        role: user.role,
      },
      secretKey,
      { expiresIn: tokenExpiry }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      expiresIn: tokenExpiry,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});


const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer Token
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, secretKey); // ตรวจสอบ Token
    req.user = decoded; // เพิ่มข้อมูลผู้ใช้ใน Request
    next(); // ดำเนินการต่อ
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

router.get('/validate-token', verifyToken, (req, res) => {
  const {  user_name, role } = req.user; // เลือกเฉพาะข้อมูลสำคัญ
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    user: { user_name, role },
  });
});


// router.use('/public', express.static(path.join(__dirname, '../../public')));

module.exports = router;