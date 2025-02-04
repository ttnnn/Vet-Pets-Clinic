import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Button, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import dayjs from 'dayjs';
import 'dayjs/locale/th';
dayjs.locale('th');

const ExportFinanceToExcel = ({ filteredAppointments }) => {
  const [selectedYear, setSelectedYear] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    // Generate the list of available years when appointments change
    const years = Array.from(
      new Set(
        filteredAppointments.map((appointment) =>
          new Date(appointment.payment_date).getFullYear()
        )
      )
    ).sort();

    setAvailableYears(years);

    // Set default year if the current selectedYear is invalid
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [filteredAppointments, selectedYear]);

  const filterAppointmentsByYear = () => {
    return filteredAppointments.filter((appointment) => {
      const appointmentYear = new Date(appointment.payment_date).getFullYear();
      return appointmentYear === selectedYear;
    });
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const handleExport = () => {
    const dataToExport = filterAppointmentsByYear().map((appointment) => ({
      วันที่: formatDate(appointment.payment_date),
      "รหัสชำระเงิน": `${appointment.payment_id}-${dayjs(appointment.invoice_date).format('YYYYMMDD')}`,
      "ชื่อลูกค้า": appointment.fullname,
      "เลขที่นัดหมาย": appointment.appointment_id,
      "ยอดชำระ": appointment.total_pay_invoice,
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
          value={selectedYear || ''}
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
        disabled={!selectedYear} // Disable the button if no year is selected
      >
        ดาวน์โหลด Excel
      </Button>
    </div>
  );
};

export default ExportFinanceToExcel;
