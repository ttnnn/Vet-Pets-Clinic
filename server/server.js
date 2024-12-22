const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
require('./cronAppointment.js')
const clinicController = require('./controllers/clinicController'); 
const customerController = require('./controllers/customerController');
// Middleware
app.use(cors());
app.use(express.json()); 
const path = require('path');
const pool = require('./db');

// การเชื่อมต่อฐานข้อมูล
pool.connect()
  .then(() => console.log('Connect PostgreSQL Success !!'))
  .catch(err => console.error('การเชื่อมต่อ PostgreSQL ล้มเหลว', err));
const staticFolder = path.join(__dirname, 'client');
//ใช้ไฟล์ static สำหรับหน้าลูกค้าและคลินิก

app.use('/customer', express.static(staticFolder, { index: 'index.html' }));
app.use('/clinic', express.static(staticFolder, { index: 'index.html' }));


app.use('/public', express.static(path.join(__dirname, '../client/public')));
app.use('/public', express.static(path.join(__dirname, '../customer/public')));


  // Routes + เส้นทาง API สำหรับคลินิกและลูกค้า
app.use('/api/clinic', clinicController);
app.use('/api/customer', customerController);

// เริ่มเซิร์ฟเวอร์
app.listen(8080, function () {
    console.log('Server running on port 8080' );
  })
  