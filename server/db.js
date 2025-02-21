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
  connectionString : process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // ถ้า Render บังคับให้ใช้ SSL
});
  
module.exports = pool;