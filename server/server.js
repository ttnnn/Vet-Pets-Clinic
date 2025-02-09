const express = require('express');
const cors = require('cors');
const app = express();
// Middleware
const http = require('http');
const path = require('path');
const pool = require('./db');
const clinicController = require('./controllers/clinicController');  // นำเข้า controller
const customerController = require('./controllers/customerController'); 
const setupSocketServer = require('./models/socketServer');
const setupCronJobs = require('./models/cronJobs');
require('dotenv').config();
app.use(cors());
app.use(express.json()); 
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

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

// Socket.IO
const io = setupSocketServer(server);

// Cron Jobs
setupCronJobs(io);

server.listen(PORT, "0.0.0.0", function () {
    console.log(`Server running on port ${PORT}`);
});
