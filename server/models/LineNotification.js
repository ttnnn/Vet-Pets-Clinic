const axios = require('axios');
const pool = require("../db");  // เชื่อมต่อฐานข้อมูล

const sendLineNotification = async (lineUserId, message, appointmentId , isReminder = false) => {
  // console.log('lineUserId',lineUserId)
  // console.log('message',message)
  // console.log('appointmentId',appointmentId)
  const token = process.env.CHANNEL_ACCESS_TOKEN;

  if (!lineUserId) {
    console.error(`Error: lineUserId is missing for appointment_id: ${appointmentId}`);
    return;
  }

  try {
    // ส่งข้อความผ่าน LINE API
    const response = await axios.post('https://api.line.me/v2/bot/message/push', {
      to: lineUserId,
      messages: [{ type: 'text', text: message }]
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });


    // อัปเดตสถานะในตาราง appointment เป็น 'success
    if (isReminder) {
      const updateQuery = `
        UPDATE appointment
        SET massage_status = 'success'
        WHERE appointment_id = $1
      `;
      await pool.query(updateQuery, [appointmentId]);
    }


  } catch (error) {
    console.error('Error sending message: ', error);
  }
};

module.exports = { sendLineNotification };
