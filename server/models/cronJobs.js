const cron = require("node-cron");
const pool = require("../db");

const setupCronJobs = (io) => {
  // ทุกๆ 5  นาที Every hour from 9:00 AM to 9:00 PM 
  cron.schedule("*/1 9-21 * * *", async () => {
    try {
      // กรองคิวที่ยังไม่เสร็จสิ้น และยังไม่ได้กดส่งคิว
      const query = `
        SELECT * FROM appointment
        WHERE appointment_date = CURRENT_DATE
        AND queue_status NOT IN ('เสร็จสิ้น', 'admit' ,'ยกเลิกนัด')
        AND appointment_time < CURRENT_TIME
        AND status NOT IN ('รออนุมัติ','ยกเลิกนัด');
      `;

      const { rows } = await pool.query(query);
    //   console.log("Pending queues:", rows); // Log ข้อมูลคิวที่ยังไม่ได้กดส่ง

      // แจ้งเตือนเมื่อมีคิวที่ยังไม่ได้กดส่งคิว
      if (rows.length > 0) {
        io.emit("queue-alert", {
          message: `ยังมี ${rows.length} คิวที่ยังไม่ได้กดส่งคิว โปรดจัดการก่อนร้านปิด!`,
          queues: rows,
        });
        console.log("Queue alert emitted:", rows); // Log การส่งแจ้งเตือน
      }

      // เช็คเวลาปัจจุบันว่าเกิน 20:00 หรือยัง
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      if (currentHour >= 20) {
        // ถ้าเลยเวลา 20:00 น. อัปเดตสถานะ
        const updateQuery = `
          UPDATE appointment
          SET status = 'ยกเลิกนัด', queue_status = 'ยกเลิกนัด'
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
};

module.exports = setupCronJobs;
