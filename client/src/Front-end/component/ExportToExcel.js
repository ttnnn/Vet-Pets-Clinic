import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Button, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import dayjs from 'dayjs';
import 'dayjs/locale/th';  // นำเข้า locale ภาษาไทย
dayjs.locale('th'); // ตั้งค่าให้ dayjs ใช้ภาษาไทย



const ExportAppointmentsByYear = ({ filteredAppointments }) => {
  const [selectedYear, setSelectedYear] = useState(null); // ค่าเริ่มต้นเป็น null

  // สร้างรายการปีที่มีข้อมูลจาก filteredAppointments
  const availableYears = Array.from(
    new Set(
      filteredAppointments.map((appointment) =>
        new Date(appointment.appointment_date).getFullYear()
      )
    )
  ).sort(); // ลำดับปีจากน้อยไปมาก

  // ฟังก์ชันสำหรับกรองข้อมูลตามปี
  const filterAppointmentsByYear = () => {
    return filteredAppointments.filter((appointment) => {
      const appointmentYear = new Date(appointment.appointment_date).getFullYear();
      return appointmentYear === selectedYear;
    });
  };
  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY'); // Use day.js for formatting
  };
const formatTime = (timeString) => {
    // แยกเวลาออกจากรูปแบบ 'HH:mm:ss+ZZ' และแสดงแค่ 'HH:mm'
    const time = timeString.split(':');  // แยกเป็น [ '16', '00', '00+07' ]
    return `${time[0]}:${time[1]}`;  // คืนค่าแค่ '16:00'
  };

  // ฟังก์ชันสำหรับ Export
  const handleExport = () => {
    const dataToExport = filterAppointmentsByYear().map((appointment) => ({
        วันที่: formatDate(appointment.appointment_date),
        เวลา: appointment.appointment_time
          ? formatTime(appointment.appointment_time)
          : "ตลอดทั้งวัน",
        "ชื่อสัตว์เลี้ยง": appointment.pet_name,
        "ชื่อเจ้าของ": appointment.full_name,
        "ประเภทบริการ": appointment.type_service,
        "รายละเอียดบริการ": appointment.detail_service || "-",
        เหตุผล: appointment.reason || "-",
        สถานะ: appointment.status,
      }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Appointments-${selectedYear}`);
    XLSX.writeFile(workbook, `Appointments-${selectedYear}.xlsx`);
  };

  return (
    <div>
      <FormControl sx={{ minWidth: 150, marginRight: 2 }}>
        <InputLabel>เลือกปี</InputLabel>
        <Select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          label="เลือกปี"
        >
          {availableYears.map((year) => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        variant="contained"
        color="primary"
        onClick={handleExport}
        sx={{ marginTop: "10px" }}
        disabled={!selectedYear} // ปิดปุ่มถ้าไม่ได้เลือกปี
      >
        ดาวน์โหลด Excel
      </Button>
    </div>
  );
};

export default ExportAppointmentsByYear;
