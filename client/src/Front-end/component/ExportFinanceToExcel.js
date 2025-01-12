import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Button, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import dayjs from 'dayjs';
import 'dayjs/locale/th';  // นำเข้า locale ภาษาไทย
dayjs.locale('th'); // ตั้งค่าให้ dayjs ใช้ภาษาไทย



const ExportFinanceToExcel = ({ filteredAppointments }) => {
  const [selectedYear, setSelectedYear] = useState(null); // ค่าเริ่มต้นเป็น null

  // สร้างรายการปีที่มีข้อมูลจาก filteredAppointments
  const availableYears = Array.from(
    new Set(
      filteredAppointments.map((appointment) =>
        new Date(appointment.payment_date).getFullYear()
      )
    )
  ).sort(); // ลำดับปีจากน้อยไปมาก

  // ฟังก์ชันสำหรับกรองข้อมูลตามปี
  const filterAppointmentsByYear = () => {
    return filteredAppointments.filter((appointment) => {
      const appointmentYear = new Date(appointment.payment_date).getFullYear();
      return appointmentYear === selectedYear;
    });
  };
  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY'); // Use day.js for formatting
  };
  // ฟังก์ชันสำหรับ Export
  const handleExport = () => {
    const dataToExport = filterAppointmentsByYear().map((appointment) => ({
        วันที่: formatDate(appointment.payment_date_date),
        "รหัสชำระเงิน": `${appointment.payment_id}-${dayjs(appointment.invoice_date).format('YYYYMMDD')}`,
        "ชื่อลูกค้า": appointment.fullname,
        "เลขที่นัดหมาย": appointment.appointment_id,
        "ยอดชำระ" :appointment.total_pay_invoice
      }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Finance-${selectedYear}`);
    XLSX.writeFile(workbook, `Finance-${selectedYear}.xlsx`);
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

export default ExportFinanceToExcel;
