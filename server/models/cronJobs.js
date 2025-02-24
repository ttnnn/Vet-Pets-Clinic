const cron = require("node-cron");
const pool = require("../db");
const LineNotification = require('./LineNotification');
const dayjs = require('dayjs');
require('dayjs/locale/th');



const setupCronJobs = (io) => {
  // ตั้งเวลา cron สำหรับการแจ้งเตือนคิวที่ยังไม่ได้กดส่ง
  cron.schedule("*/10 9-20 * * *", async () => {
    const job = setTimeout(() => {
      console.log("Job timed out");
    }, 1000 * 60 * 5); // ตัดงานถ้าเกิน 5 นาที
  
    try {
      const query = `
      SELECT * FROM appointment
      WHERE appointment_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::DATE
      AND queue_status NOT IN ('เสร็จสิ้น', 'admit' ,'ยกเลิกนัด')
      AND appointment_time < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::TIME
      AND status NOT IN ('รออนุมัติ','ยกเลิกนัด');

      `;
      const { rows } = await pool.query(query);

      // แจ้งเตือนคิวที่ยังไม่ได้กดส่ง
      if (rows.length > 0) {
        io.emit("queue-alert", {
          message: `ยังมี ${rows.length} คิวที่ยังไม่ได้กดส่งคิว โปรดจัดการก่อนร้านปิด!`,
          queues: rows,
          playSound: true, // เพิ่ม property นี้เพื่อบอกฝั่ง Client ให้เล่นเสียง
        });
      }

      // อัปเดตสถานะคิวหลังเวลา 20:00 น.
      const bangkokTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
      const bangkokHour = new Date(bangkokTime).getHours();

      const currentHour = bangkokHour;

      if (currentHour === 20) {
        const updateQuery = `
        UPDATE appointment
          SET status = 'ยกเลิกนัด', queue_status = 'ยกเลิกนัด', massage_status = 'cancle'
          WHERE queue_status IN ('รอรับบริการ')
          AND appointment_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::DATE
          AND appointment_time < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::TIME
        `;
        await pool.query(updateQuery);
        console.log('Appointment status updated to "ยกเลิกนัด" after 20:00');
        io.emit('notification', {
          message: 'มีคิวที่ถูกยกเลิกเนื่องจากเลยเวลา 20:00 น.',
          playSound: true, // เพิ่ม property นี้เพื่อบอกฝั่ง Client ให้เล่นเสียง
        });
      }

      //console.log("Cron job executed successfully");
    } catch (error) {
      console.error("Error in cron job:", error);
    }finally {
      clearTimeout(job);}
  });
  

  // const ApproveAppointmentReminders = async () => {
    // const query = `
    // SELECT * FROM appointment
      // WHERE appointment_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::DATE
      // AND appointment_time >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::TIME
      // AND status = 'รออนุมัติ';
  // `;
  // const { rows } = await pool.query(query);
  //แจ้งเตือนคิวที่ยังไม่ได้กดส่ง
  // if (rows.length > 0) {
    // io.emit("queue-alert", {
      // message: `มี ${rows.length} นัดหมายใหม่รออนุมัติ`,
      // queues: rows,
      // playSound: true, // เพิ่ม property นี้เพื่อบอกฝั่ง Client ให้เล่นเสียง
    // });

  // }
  // }
  // ฟังก์ชันสำหรับส่งการแจ้งเตือนนัดหมาย

  const sendAppointmentReminders = async () => {
    const query = `
    SELECT 
    a.appointment_date, 
    a.appointment_time, 
    a.type_service,
    p.pet_name, 
    o.line_id, 
    a.appointment_id
    FROM 
        appointment a
    JOIN 
        owner o ON a.owner_id = o.owner_id
    JOIN 
        pets p ON a.pet_id = p.pet_id
    WHERE 
        a.status = 'อนุมัติ'
        AND a.queue_status = 'รอรับบริการ'
        AND a.appointment_date::DATE = ((CURRENT_DATE AT TIME ZONE 'Asia/Bangkok') + INTERVAL '1 day')::DATE;
    `;
  
    try {
      const { rows } = await pool.query(query);
      rows.forEach(appointment => {
        const formatDate = dayjs(appointment.appointment_date).locale('th').format('D MMMM YYYY');
  
        let message = `แจ้งเตือนนัดหมาย:\n${appointment.pet_name} มีนัดหมาย ${appointment.type_service} ในวันพรุ่งนี้`;
  
        // เช็คประเภทบริการ ถ้าเป็น "ฝากเลี้ยง" ไม่ต้องแสดงเวลา
        if (appointment.type_service === 'ฝากเลี้ยง') {
          message += `\nวันที่ ${formatDate}`;
        } else {
          const formattedTime = appointment.appointment_time.split('+')[0];
          message += `\nวันที่ ${formatDate} เวลา ${formattedTime} น.`;
        }
  
        LineNotification.sendLineNotification(appointment.line_id, message, appointment.appointment_id, true);
      });
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };
  

  const sendAlert = async () => {
    const query = `
        SELECT  
        p.pet_name, 
        o.line_id, 
        a.appointment_id,
        h.end_date
    FROM 
        appointment a
    LEFT JOIN 
        owner o ON a.owner_id = o.owner_id
    LEFT JOIN 
        pets p ON a.pet_id = p.pet_id
    LEFT JOIN 
        petshotel h ON h.appointment_id = a.appointment_id
    WHERE 
        h.end_date < CURRENT_DATE
        AND a.queue_status IN ('กำลังให้บริการ','admit')
        AND h.status = 'checkin' 
    `;
  
    try {
      const { rows } = await pool.query(query);
      rows.forEach(appointment => {
  
        const message = `นัดหมายของคุณ เกินเวลาที่กำหนด กรุณาติดต่อเจ้าหน้าที่ เพื่อขยายเวลาเข้าพัก`;
        
        LineNotification.sendLineNotification(appointment.line_id, message,appointment.appointment_id,false);
      });
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };
  const sendLateArrivalNotification = async () => {
    const query = `
       SELECT  
     a.appointment_id,
     a.appointment_time,
     p.pet_name, 
     o.line_id
 FROM 
     appointment a
 LEFT JOIN 
     owner o ON a.owner_id = o.owner_id
 LEFT JOIN 
     pets p ON a.pet_id = p.pet_id
 WHERE 
     a.queue_status = 'รอรับบริการ'
     AND a.status = 'อนุมัติ'
     AND a.appointment_date = (CURRENT_DATE AT TIME ZONE 'Asia/Bangkok')::DATE
     AND a.appointment_time = (CURRENT_TIME AT TIME ZONE 'Asia/Bangkok' - INTERVAL '15 minutes')::TIME;
    `;

    try {
        const { rows } = await pool.query(query);
        rows.forEach(appointment => {
            const message = `แจ้งเตือน: ${appointment.pet_name} ยังไม่ได้มาตามนัดภายใน 15 นาที กรุณาติดต่อคลินิกเพื่อยืนยันการเข้ารับบริการ`;
            
            LineNotification.sendLineNotification(appointment.line_id, message, appointment.appointment_id, false);
        });
    } catch (error) {
        console.error('Error fetching late appointments:', error);
    }
};


  // ตั้งเวลา cron สำหรับการส่งการแจ้งเตือนนัดหมายทุกวันเวลา 09:00 น.

    cron.schedule('0 9 * * *', sendAppointmentReminders, { timezone: "Asia/Bangkok" });
    // cron.schedule('*/1 9-20 * * *', ApproveAppointmentReminders, { timezone: "Asia/Bangkok" });
    cron.schedule('0 9 * * *', sendAlert, { timezone: "Asia/Bangkok" });
    cron.schedule('*/1 9-20 * * *', sendLateArrivalNotification, { timezone: "Asia/Bangkok" });


};

module.exports = setupCronJobs;
