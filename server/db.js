const { Pool } = require('pg');
require('dotenv').config();

// const pool = new Pool({
    // host: process.env.DB_HOST,
    // user: process.env.DB_USER,
    // password: process.env.DB_PASSWORD,
    // database: process.env.DB_NAME,
    // port: process.env.DB_PORT ,// ระบุพอร์ตหากจำเป็น (ค่าเริ่มต้นของ PostgreSQL คือ 5432)
    // ssl: false, // ใช้ 
  // });
// 

const pool = new Pool({
  connectionString: "postgresql://tthanaphon:MX8vASk8it2fOlMS3trGAPmJrjDSXXP1@dpg-cu2v6nogph6c73bkpm3g-a.singapore-postgres.render.com/pets_clinic_db",
  ssl: { rejectUnauthorized: false }, // ถ้า Render บังคับให้ใช้ SSL
});
  
module.exports = pool;