const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http');
const path = require('path');
const pool = require('./db');
const clinicController = require('./controllers/clinicController');
const customerController = require('./controllers/customerController');
const setupSocketServer = require('./models/socketServer');
const setupCronJobs = require('./models/cronJobs');
require('dotenv').config();

app.use(cors());
app.use(express.json());
const server = http.createServer(app);

// เชื่อมต่อฐานข้อมูล
pool.connect()
  .then(() => console.log('Connect PostgreSQL Success !!'))
  .catch(err => console.error('การเชื่อมต่อ PostgreSQL ล้มเหลว', err));

// กำหนดเส้นทาง Static Files
const staticFolder = path.join(__dirname, '../client/build'); // แก้ตรงนี้
app.use(express.static(staticFolder));

// API Routes
app.use('/api/clinic', clinicController);
app.use('/api/customer', customerController);

// ให้ React จัดการ Routing เอง
app.get('*', (req, res) => {
  res.sendFile(path.join(staticFolder, 'index.html'));
});

// Socket.IO
const io = setupSocketServer(server);

// Cron Jobs
setupCronJobs(io);

// Start Server
const PORT = process.env.PORT || 10000;
server.listen(PORT, function () {
  console.log(`Server running on port ${PORT}`);
});
