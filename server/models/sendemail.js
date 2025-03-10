const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// ฟังก์ชันสร้างรหัสผ่านใหม่แบบสุ่ม
const generateRandomPassword = () => {
    return crypto.randomBytes(4).toString('hex'); // 8 ตัวอักษร
};

// ฟังก์ชันส่งอีเมล
const sendResetEmail = async (email, newPassword) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'รีเซตรหัสผ่านใหม่',
        text: `รหัสผ่านใหม่ของคุณคือ: ${newPassword}`
    };

    await transporter.sendMail(mailOptions);
};

// API รีเซตรหัสผ่านโดยไม่ต้องตรวจสอบฐานข้อมูล
router.post('/forgot-password', async (req, res) => {
    const { email,username } = req.body;

    if (!email || !username) {
        return res.status(400).json({ success: false, message: "กรุณากรอกอีเมล หรือ username ให้ถูกต้อง" });
    }

    try {
        const newPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(newPassword, 10); // เข้ารหัสรหัสผ่านใหม่

        // อัปเดตรหัสผ่านในฐานข้อมูล
        await pool.query("UPDATE personnel SET password_encrip = $1 WHERE user_name = $2", [hashedPassword, username]);

        // ส่งอีเมลแจ้งรหัสผ่านใหม่
        await sendResetEmail(email, newPassword);

        res.json({ success: true, message: "รหัสผ่านใหม่ถูกส่งไปที่อีเมลของคุณแล้ว และสามารถใช้ล็อกอินได้" });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" });
    }
});


module.exports = router;
