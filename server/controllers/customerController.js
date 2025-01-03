const path = require('path');
const dayjs = require('dayjs');
const express = require('express');
const router = express.Router();
require('dotenv').config();
const pool = require('../db.js');
const multer = require('multer');
router.use('/public', express.static(path.join(__dirname, '../../client/public')));  


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../../client/public/Images')); // save images in the 'uploads' folder
  },
  filename: (req, file, cb) => {
      cb(null, file.fieldname+"_"+Date.now()+ path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.post('/owner/check-owner', async (req, res) => {
    const { first_name, last_name, phone_number } = req.body;
    console.log('/owner/check-owner', req.body);
  
    // ตรวจสอบว่าข้อมูลครบถ้วนหรือไม่
    if (!first_name || !last_name || !phone_number) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
  
    try {
      const query = `
      SELECT * 
        FROM owner
        WHERE TRIM(first_name) ILIKE $1 
          AND TRIM(last_name) ILIKE $2 
          AND TRIM(phone_number) ILIKE $3;

      `;
      const values = [first_name, last_name, phone_number];
  
      const result = await pool.query(query, values);
      console.log('result', result.rows); // แสดงผลลัพธ์จากฐานข้อมูล
  
      if (result.rows.length > 0) {
        res.status(200).json({ success: true, message: 'พบข้อมูลในระบบ', data: result.rows[0] });
      } else {
        res.status(404).json({ success: false, message: 'ไม่พบข้อมูลในระบบ' });
      }
    } catch (error) {
      console.error('Database query error:', error);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

router.get('/appointments', async (req, res) => { 
  const { first_name, last_name, phone_number } = req.query;
  console.log('/appointments', req.query);

  try {
    // ค้นหาข้อมูล Owner
    const owner = await pool.query(
      `SELECT owner_id
        FROM owner
        WHERE TRIM(first_name) ILIKE $1 
          AND TRIM(last_name) ILIKE $2 
          AND TRIM(phone_number) ILIKE $3;`,
      [first_name, last_name, phone_number]
    );
   
    if (owner.rows.length === 0) {
      return res.status(404).json({ message: 'Owner not found' });
    }

    const owner_id = owner.rows[0].owner_id;
    console.log('Owner ID:', owner_id);  // ตรวจสอบ owner_id

    if (!owner_id) {
      return res.status(400).json({ message: 'Owner does not have a valid ID' });
    }

    // ดึงข้อมูลการนัดหมาย
    const appointments = await pool.query(
      `SELECT pets.pet_name, pets.image_url, pets.pet_id, appointment.appointment_date, appointment.appointment_time, 
              appointment.status, appointment.appointment_id, appointment.type_service ,appointment.owner_id,
              appointment.queue_status
       FROM appointment 
       JOIN pets ON appointment.pet_id = pets.pet_id 
       WHERE appointment.owner_id = $1
         AND appointment.appointment_date >= CURRENT_DATE -- เฉพาะวันปัจจุบันหรือหลังจากนั้น
       ORDER BY appointment.appointment_date ASC, appointment.appointment_time ASC`,
      [owner_id]
    );
    

    console.log('Appointments:', appointments.rows);  // ตรวจสอบ appointments ที่ได้

    return res.status(200).json({ appointments: appointments.rows });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/appointments/history', async (req, res) => {
  const { first_name, last_name, phone_number } = req.query;

  try {
    const owner = await pool.query(
      `SELECT owner_id FROM owner
       WHERE TRIM(first_name) ILIKE $1 
         AND TRIM(last_name) ILIKE $2 
         AND TRIM(phone_number) ILIKE $3;`,
      [first_name, last_name, phone_number]
    );

    if (owner.rows.length === 0) {
      return res.status(404).json({ message: 'Owner not found' });
    }

    const owner_id = owner.rows[0].owner_id;

    // Query ที่จะดึงข้อมูลการนัดหมายที่ถูกยกเลิกหรือผ่านไปแล้ว
    const appointments = await pool.query(
      `SELECT pets.pet_name, pets.image_url, appointment.appointment_date, appointment.appointment_time, 
              appointment.status, appointment.appointment_id, appointment.type_service, appointment.queue_status
       FROM appointment
       JOIN pets ON appointment.pet_id = pets.pet_id
       WHERE appointment.owner_id = $1 
         AND (
            -- นัดหมายที่ถูกยกเลิกและยังไม่ถึงวัน
            (appointment.status = 'ยกเลิกนัด' AND appointment.appointment_date >= CURRENT_DATE)
            OR
            -- นัดหมายที่ผ่านไปแล้วและไม่ได้ถูกยกเลิก
            (appointment.status != 'ยกเลิกนัด' AND appointment.appointment_date < CURRENT_DATE)
         )`,
      [owner_id]
    );

    return res.status(200).json({ appointments: appointments.rows });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});



// เส้นทาง GET สำหรับดึงข้อมูลการนัดหมายโดยใช้ appointment_id
router.get('/appointments/detail/:id', async (req, res) => {
  const { id } = req.params; // รับค่า id จาก URL
  console.log('/appointments/:id', id);

  try {
    // คำสั่ง SQL สำหรับดึงรายละเอียดการนัดหมาย
    const appointmentDetails = await pool.query(
      `SELECT a.appointment_id, a.appointment_date, a.appointment_time, 
              a.type_service, a.reason, a.status, 
              p.pet_name, p.pet_species, p.pet_breed, 
              o.first_name, o.last_name, o.phone_number
       FROM appointment a
       JOIN pets p ON a.pet_id = p.pet_id
       JOIN owner o ON a.owner_id = o.owner_id
       WHERE a.appointment_id = $1;`,
      [id]
    );

    // ตรวจสอบว่าพบข้อมูลหรือไม่
    if (appointmentDetails.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการนัดหมาย' });
    }

    // ส่งข้อมูลกลับไปยังผู้ใช้
    return res.status(200).json({ 
      success: true, 
      message: 'ดึงข้อมูลการนัดหมายสำเร็จ',
      data: appointmentDetails.rows[0]
    });
  } catch (error) {
    console.error('Error fetching appointment details:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

router.get('/pets', async (req, res) => { 
  const { first_name, last_name, phone_number } = req.query;
  console.log('/pets', req.query);

  try {
    // ค้นหาข้อมูล Owner
    const owner = await pool.query(
      `SELECT owner_id
        FROM owner
        WHERE TRIM(first_name) ILIKE $1 
          AND TRIM(last_name) ILIKE $2 
          AND TRIM(phone_number) ILIKE $3;`,
      [first_name, last_name, phone_number]
    );
   
    if (owner.rows.length === 0) {
      return res.status(404).json({ message: 'Owner not found' });
    }

    const owner_id = owner.rows[0].owner_id;
    console.log('Owner ID:', owner_id); 

    if (!owner_id) {
      return res.status(400).json({ message: 'Owner does not have a valid ID' });
    }

    // ดึงข้อมูลการนัดหมาย
    const pets = await pool.query(
      `SELECT pets.pet_id, pets.pet_name, pets.pet_breed, pets.image_url, pets.pet_species
       FROM pets 
       WHERE owner_id = $1`,
      [owner_id]
    );
    
    console.log('pets:', pets.rows);  

    return res.status(200).json({ pets: pets.rows });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/pets/:id', async (req, res) => {
  console.log('/pets/:id', req.params);
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM pets WHERE pet_id = $1', [id]);
  
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API สำหรับยกเลิกนัดหมาย
router.post('/appointment/cancel', async (req, res) => {
  const { appointmentId } = req.body; // รับ appointmentId จาก request body

  try {
    // อัพเดตสถานะการนัดหมายในฐานข้อมูล
    const query = 'UPDATE appointment SET queue_status = $1, status = $2 WHERE appointment_id = $3';
    const values = ['ยกเลิกนัด', 'ยกเลิกนัด', appointmentId];

    const result = await pool.query(query, values);

    if (result.rowCount > 0) {
      // ถ้าสำเร็จ ส่งผลลัพธ์กลับไปที่ frontend
      res.json({ success: true, message: 'การนัดหมายถูกยกเลิกแล้ว' });
    } else {
      res.status(404).json({ success: false, message: 'ไม่พบการนัดหมายที่ต้องการยกเลิก' });
    }
  } catch (error) {
    console.error('Error canceling appointment:', error.message);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการยกเลิกนัด' });
  }
});

router.put('/pets/:id/image', upload.single('image'), async (req, res) => {
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


module.exports = router;
