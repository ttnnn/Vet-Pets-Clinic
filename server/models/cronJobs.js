const cron = require("node-cron");
const pool = require("../db");
const LineNotification = require('./LineNotification');
const dayjs = require('dayjs');
require('dayjs/locale/th');


const setupCronJobs = (io) => {
  // ตั้งเวลา cron สำหรับการแจ้งเตือนคิวที่ยังไม่ได้กดส่
  cron.schedule("*/10 9-21 * * *", async () => {
    const job = setTimeout(() => {
      console.log("Job timed out");
    }, 1000 * 60 * 5); // ตัดงานถ้าเกิน 5 นาที
  
    try {
      
      const bangkokTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
      const currentDateTime = new Date(bangkokTime);
      const currentHour = currentDateTime.getHours(); // ✅ currentHour ถูกประกาศก่อนใช้งาน;
      
      const query = `
      SELECT * FROM appointment
      WHERE appointment_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::DATE
      AND queue_status NOT IN ('เสร็จสิ้น', 'admit', 'ยกเลิกนัด')
      AND status NOT IN ('รออนุมัติ', 'ยกเลิกนัด')
      AND NOT (
        type_service = 'ฝากเลี้ยง'
        AND queue_status = 'กำลังให้บริการ');
      `;
  
      const { rows } = await pool.query(query);
  
      if (rows.length > 0) {
        io.emit("queue-alert", {
          message: `ยังมี ${rows.length} คิวที่ยังไม่ได้กดส่งคิว โปรดจัดการก่อนร้านปิด!`,
          queues: rows,
          playSound: true,
        });
      }

      if (currentHour >= 20) {
        const updateQuery = `
          UPDATE appointment
          SET status = 'ยกเลิกนัด', queue_status = 'ยกเลิกนัด', massage_status = 'cancle'
          WHERE queue_status = 'รอรับบริการ'
          AND appointment_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::DATE;
        `;
  
        await pool.query(updateQuery);
        console.log('Appointment status updated to "ยกเลิกนัด" after 20:00');
  
        io.emit('notification', {
          message: 'มีคิวที่ถูกยกเลิกเนื่องจากเลยเวลา 20:00 น.',
          playSound: true,
        });
      }  

    } catch (error) {
      console.error("Error in cron job:", error);
    } finally {
      clearTimeout(job);
    }
  });
  
  
  

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
          const formattedTime = appointment.appointment_time ? appointment.appointment_time.split('+')[0] : 'ไม่ระบุเวลา';
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
            AND a.appointment_time <= (CURRENT_TIME AT TIME ZONE 'Asia/Bangkok' - INTERVAL '15 minutes')::TIME
            AND a.appointment_time > (CURRENT_TIME AT TIME ZONE 'Asia/Bangkok' - INTERVAL '16 minutes')::TIME;
    `;

    // ใช้ Set เพื่อกันแจ้งเตือนซ้ำ
    const notifiedAppointments = new Set();

    try {
        const { rows } = await pool.query(query);
        rows.forEach(appointment => {
            if (!notifiedAppointments.has(appointment.appointment_id)) {
                const message = `⏰ แจ้งเตือน: น้อง ${appointment.pet_name} ยังไม่ได้มาตามนัดภายใน 15 นาที กรุณาติดต่อคลินิกเพื่อยืนยันการเข้ารับบริการ`;

                LineNotification.sendLineNotification(appointment.line_id, message, appointment.appointment_id, false);

                // เพิ่มเข้า Set เพื่อกันการแจ้งเตือนซ้ำ
                notifiedAppointments.add(appointment.appointment_id);
            }
        });
    } catch (error) {
        console.error('Error fetching late appointments:', error);
    }
};


  // ตั้งเวลา cron สำหรับการส่งการแจ้งเตือนนัดหมายทุกวันเวลา 09:00 น.

    cron.schedule('0 9 * * *', sendAppointmentReminders, { timezone: "Asia/Bangkok" });
    cron.schedule('0 9 * * *', sendAlert, { timezone: "Asia/Bangkok" });
    cron.schedule('*/5 9-20 * * *', sendLateArrivalNotification, { timezone: "Asia/Bangkok" });


};

module.exports = setupCronJobs;
