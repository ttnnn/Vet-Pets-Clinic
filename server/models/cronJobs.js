const cron = require("node-cron");
const pool = require("../db");
const LineNotification = require('./LineNotification');
const dayjs = require('dayjs');
require('dayjs/locale/th');



const setupCronJobs = (io) => {
  // ตั้งเวลา cron สำหรับการแจ้งเตือนคิวที่ยังไม่ได้กดส่ง
  cron.schedule("*/1 9-21 * * *", async () => {
    try {
      const query = `
        SELECT * FROM appointment
        WHERE appointment_date = CURRENT_DATE
        AND queue_status NOT IN ('เสร็จสิ้น', 'admit' ,'ยกเลิกนัด')
        AND appointment_time < CURRENT_TIME
        AND status NOT IN ('รออนุมัติ','ยกเลิกนัด');
      `;
      const { rows } = await pool.query(query);

      // แจ้งเตือนคิวที่ยังไม่ได้กดส่ง
      if (rows.length > 0) {
        io.emit("queue-alert", {
          message: `ยังมี ${rows.length} คิวที่ยังไม่ได้กดส่งคิว โปรดจัดการก่อนร้านปิด!`,
          queues: rows,
        });
        console.log("Queue alert emitted:", rows);
      }

      // อัปเดตสถานะคิวหลังเวลา 20:00 น.
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      if (currentHour >= 20) {
        const updateQuery = `
          UPDATE appointment
          SET status = 'ยกเลิกนัด', queue_status = 'ยกเลิกนัด' ,  massage_status = 'cancle'
          WHERE queue_status IN ('รอรับบริการ')
            AND appointment_date = CURRENT_DATE
            AND CURRENT_TIME > appointment_time;
        `;
        await pool.query(updateQuery);
        console.log('Appointment status updated to "ยกเลิกนัด" after 20:00');
        io.emit('notification', {
          message: 'มีคิวที่ถูกยกเลิกเนื่องจากเลยเวลา 20:00 น.',
        });
      }

      console.log("Cron job executed successfully");
    } catch (error) {
      console.error("Error in cron job:", error);
    }
  });
  


  // ฟังก์ชันสำหรับส่งการแจ้งเตือนนัดหมาย
  const sendAppointmentReminders = async () => {
    const query = `
      SELECT a.appointment_date, a.appointment_time, p.pet_name, o.line_id, a.appointment_id
    FROM appointment a
    JOIN owner o ON a.owner_id = o.owner_id
    JOIN pets p ON a.pet_id = p.pet_id
    WHERE a.status ='อนุมัติ'
    `;
  
    try {
      const { rows } = await pool.query(query);
      rows.forEach(appointment => {
        // แปลง appointment_time ให้อยู่ในรูปแบบ '10:00'  
        const formattedTime = appointment.appointment_time.split('+')[0];
        const formatDate = dayjs(appointment.appointment_date).locale('th').format('D MMMM YYYY');  // ใช้ dayjs แปลงเป็นวันที่ไทย
  
        const message = `แจ้งเตือนนัดหมาย:\n${appointment.pet_name} มีนัดหมายในวันพรุ่งนี้ วันที่ ${formatDate}\nเวลา ${formattedTime} นาที.`;

        
        LineNotification.sendLineNotification(appointment.line_id, message,appointment.appointment_id);
      });
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };
  
  // const message = `นัดหมายได้รับอนุมัติ  ${appointment.pet_name} มีนัดหมายหมายในวันที่ ${formatDate}\nเวลา ${formattedTime} นาที.`;

  // ตั้งเวลา cron สำหรับการส่งการแจ้งเตือนนัดหมายทุกวันเวลา 09:00 น.
  cron.schedule('0 9 * * *', sendAppointmentReminders);
};

module.exports = setupCronJobs;
