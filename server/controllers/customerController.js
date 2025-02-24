const axios = require("axios"); // CommonJS syntax
const path = require('path');;
const express = require('express');
const router = express.Router();
require('dotenv').config();
const pool = require('../db.js');
const multer = require('multer');
router.use('/public', express.static(path.join(__dirname, '../../client/public')));  
const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");
const cloudinary = require('../models/cloudinary'); 
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
      folder: 'pets_images', // Change this to your desired Cloudinary folder
      allowed_formats: ['jpg', 'jpeg', 'png'], // Allowed file formats
  },
});

const upload = multer({ storage });

// Upload route
router.post('/uploads', upload.single('image'), (req, res) => {
  if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
  }
  res.status(200).json({ imageUrl: req.file.path });
});


const verifyLineToken = async (idToken) => {
  try {
    // ดึง Public Keys จาก LINE
    const { data: keys } = await axios.get("https://api.line.me/oauth2/v2.1/certs");

    // ถอดรหัส Header จาก idToken เพื่อหา kid (Key ID)
    const { header } = jwt.decode(idToken, { complete: true });
    if (!header || !header.kid) throw new Error("Invalid Token Header");

    // หา Public Key ที่ตรงกับ kid
    const jwk = keys.keys.find((key) => key.kid === header.kid);
    if (!jwk) throw new Error("Public key not found");

    // แปลง JWK เป็น PEM (รูปแบบ Public Key ที่ใช้ใน jwt.verify)
    const pem = jwkToPem(jwk);

    // ตรวจสอบความถูกต้องของ Token
    const decoded = jwt.verify(idToken, pem, {
      audience: "2006068191", // ตรวจสอบค่า aud (Audience)
      issuer: "https://access.line.me", // ตรวจสอบค่า iss (Issuer)
    });

    // คืนค่า userId (sub) จาก Token
    return decoded.sub;
  } catch (error) {
    // ตรวจสอบกรณี Token หมดอายุ
    if (error.name === "TokenExpiredError") {
      console.error("Token has expired:", error);
      throw new Error("Token expired. Please reauthenticate.");
    }

    // กรณีอื่นๆ ที่เกี่ยวข้องกับการตรวจสอบ Token
    console.error("Token verification failed:", error);
    throw new Error("Invalid token");
  }
};


router.post("/owner/check-owner", async (req, res) => {
  const { first_name, last_name, phone_number } = req.body;
  const token = req.headers.authorization?.split(' ')[1]; // รับ Token จาก Header

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token is required' });
  }

  if (!first_name || !last_name || !phone_number) {
    return res
      .status(400)
      .json({ success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  try {
   
    const userId = await verifyLineToken(token);
    const checkQuery = `
      SELECT * 
      FROM owner
      WHERE TRIM(first_name) ILIKE $1 
        AND TRIM(last_name) ILIKE $2 
        AND TRIM(phone_number) ILIKE $3;
    `;
    const checkValues = [first_name, last_name, phone_number];
    const result = await pool.query(checkQuery, checkValues);

    if (result.rows.length > 0) {

       const existingOwner = result.rows[0];

      if (existingOwner.line_id) {
        // ถ้ามี userId อยู่แล้ว ไม่ต้องทำอะไร
        return res.status(200).json({
          success: true,
          message: "มีข้อมูล userId อยู่ในระบบแล้ว",
          data:  existingOwner           
        });
      } else {
        // ถ้ายังไม่มี userId ให้เพิ่มข้อมูล
        const updateQuery = `
          UPDATE owner 
          SET line_id = $1 
          WHERE TRIM(first_name) ILIKE $2 
            AND TRIM(last_name) ILIKE $3 
            AND TRIM(phone_number) ILIKE $4;
        `;
        const updateValues = [userId, first_name, last_name, phone_number];
        await pool.query(updateQuery, updateValues);

        return res.status(200).json({
          success: true,
          message: "เพิ่ม userId ลงในระบบเรียบร้อยแล้ว",
          data: { ...existingOwner, line_user_id: userId },
        });
      }
    } else {
      // ถ้าไม่พบข้อมูลในระบบ ให้แจ้งว่าข้อมูลไม่ตรง
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลในระบบ กรุณาตรวจสอบชื่อ-นามสกุล หรือเบอร์โทร",
      });
    }
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในระบบ",
    });
  }
});

router.get('/appointments', async (req, res) => { 
  const { first_name, last_name, phone_number } = req.query;

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
    

    if (appointments.rows.length === 0) {
      return res.status(200).json({ owner_id, message: 'No upcoming appointments found' });
    }

    return res.status(200).json({ owner_id, appointments: appointments.rows });
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
     (appointment.status = 'ยกเลิกนัด')OR (appointment.appointment_date < CURRENT_DATE)
    );`,
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
    
    return res.status(200).json({ pets: pets.rows });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/pets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM pets WHERE pet_id = $1', [id]);
  
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history/vaccien/:pet_id', async (req, res) => {
  const { pet_id } = req.params;
  try {
    // Query ดึงข้อมูลจากฐานข้อมูล
    const result = await pool.query(`
      SELECT c.category_name 
      FROM historyvaccine h
      LEFT JOIN servicecategory c ON c.category_id = h.category_id
      WHERE pet_id = $1
    `, [pet_id]);

    // ถ้ามีผลลัพธ์ จะส่งคืนรายการ category_name ทั้งหมด
    if (result.rows.length > 0) {
      res.json(result.rows); // ส่งกลับทุกแถวที่ดึงมา
    } else {
      res.status(404).json({ message: 'No vaccine history found for this pet.' }); // ถ้าไม่มีข้อมูล
    }
  } catch (error) {
    // ถ้ามีข้อผิดพลาดในการ query
    res.status(500).json({ error: error.message });
  }
});


// API สำหรับยกเลิกนัดหมาย
router.put('/appointment/cancel', async (req, res) => {
  const { appointmentId } = req.body; // รับ appointmentId จาก request body
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // อัปเดตสถานะการนัดหมายในตาราง appointment
      const appointmentQuery = 'UPDATE appointment SET queue_status = $1, status = $2, massage_status = $3 WHERE appointment_id = $4';
      const appointmentValues = ['ยกเลิกนัด', 'ยกเลิกนัด', 'cancle', appointmentId];
      const appointmentResult = await client.query(appointmentQuery, appointmentValues);

      if (appointmentResult.rowCount > 0) {
        // อัปเดตสถานะการฝากเลี้ยงในตาราง pethotel ด้วย
        const hotelQuery = 'UPDATE petshotel SET status = $1 WHERE appointment_id = $2';
        const hotelValues = ['cancle', appointmentId];
        await client.query(hotelQuery, hotelValues);

        await client.query('COMMIT');
        res.json({ success: true, message: 'การนัดหมายและการฝากเลี้ยงถูกยกเลิกแล้ว' });
      } else {
        await client.query('ROLLBACK');
        res.status(404).json({ success: false, message: 'ไม่พบการนัดหมายที่ต้องการยกเลิก' });
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error canceling appointment:', error.message);
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการยกเลิกนัด' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database connection error:', error.message);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล' });
  }
});


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



module.exports = router;
