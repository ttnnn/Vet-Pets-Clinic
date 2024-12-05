import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Snackbar,
  Autocomplete,
  TextField,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

const api = "http://localhost:8080";

const ChooseVac = ({
  open,
  handleClose,
  TypeService,
  appointmentId,
  petId,
  updateAppointments,
  onMoveToPending,
}) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [vaccineList, setVaccineList] = useState([]);
  const [selectedVaccine, setSelectedVaccine] = useState("");
  const [loading, setLoading] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [petDetails, setPetDetails] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [note, setNote] = useState("");

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    const fetchVaccines = async () => {
      if (TypeService === "วัคซีน") {
        setLoading(true);
        try {
          const response = await axios.get(`${api}/vaccines`);
          setVaccineList(response.data);
        } catch (error) {
          console.error("Error fetching vaccines:", error);
          setSnackbarOpen(true);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchVaccines(); // Ensure the function is called
  }, [TypeService]);
  
  useEffect(() => {
    const fetchAppointmentAndPetDetails = async () => {
      try {
        const appointmentResponse = await axios.get(
          `${api}/appointments/${appointmentId}`
        );
        const petResponse = await axios.get(`${api}/pets/${petId}`);
        setAppointmentDetails(appointmentResponse.data);
        setPetDetails(petResponse.data);
      } catch (error) {
        console.error("Error fetching appointment or pet details:", error);
        setSnackbarOpen(true);
      }
    };
    if (appointmentId && petId) {
      fetchAppointmentAndPetDetails();
    }
  }, [appointmentId, petId]);

  
  const handleCloseDialog = () => {
    handleClose();
    setSelectedVaccine("");
    setAlertMessage("");
    setNote("");
  };

  const saveVaccineSelection = async () => {
    if (!selectedVaccine) {
      setAlertMessage("กรุณาเลือกวัคซีนก่อนบันทึก");
      return;
    }

    try {
      const response = await axios.post(
        `${api}/appointments/${appointmentId}/vaccines`,
        {
          pet_id: petId,
          vaccine_id: selectedVaccine,
          notes: note,
        }
      );
      if (response.status === 200) {
        setSnackbarOpen(true);
        setConfirmationOpen(false); // Close the confirmation dialog
        handleClose(); // Close the main dialog
        updateAppointments(); // Update appointments
        onMoveToPending(appointmentId);
      }
    } catch (error) {
      console.error("Error saving vaccine:", error);
      setAlertMessage("การบันทึกมีข้อผิดพลาด โปรดลองอีกครั้ง");
    }
  };

  const handleConfirmSave = () => {
    setConfirmationOpen(true);
  };

  const handleConfirmClose = () => {
    setConfirmationOpen(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>เลือกวัคซีน</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
              height: "350px",
            }}
          >
            {TypeService === "วัคซีน" && (
              <Box sx={{ flex: "1", maxWidth: "400px" }}>
                <Autocomplete
                  disablePortal
                  options={vaccineList}
                  getOptionLabel={(option) => option.category_name}
                  onChange={(event, newValue) =>
                    setSelectedVaccine(newValue?.category_id || "")
                  }
                  sx={{ width: "100%" }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="เลือกวัคซีน"
                      disabled={loading}
                    />
                  )}
                />
              </Box>
            )}

            {appointmentDetails && petDetails && (
              <Box sx={{ flex: "1", maxWidth: "400px" }}>
                <Typography variant="h6">ข้อมูลนัดหมาย</Typography>
                <Typography>
                  วันที่นัดหมาย:{" "}
                  {dayjs(appointmentDetails.appointment_date).format(
                    "DD MMMM YYYY"
                  )}
                </Typography>
                <Typography>
                  ประเภทบริการ: {appointmentDetails.type_service}
                </Typography>
                <Typography variant="h6" mt={2}>
                  ข้อมูลสัตว์เลี้ยง
                </Typography>
                <Typography>ชื่อสัตว์เลี้ยง: {petDetails.pet_name}</Typography>
                <Typography>ประเภทสัตว์: {petDetails.pet_species}</Typography>
                {selectedVaccine ? (
                  <Box mt={2}>
                    <Typography variant="subtitle1" color="blue">
                      คุณเลือกวัคซีน:{" "}
                      {
                        vaccineList.find((vaccine) => vaccine.category_id === selectedVaccine)
                          ?.category_name || "ยังไม่ได้เลือกวัคซีน"
                      }
                    </Typography>
                  </Box>
                ) : (
                  <Box mt={2}>
                    <Typography variant="subtitle1" color="gray">
                      คุณยังไม่ได้เลือกวัคซีน
                    </Typography>
                  </Box>
                )}
                   <Box mt={2}>
                <TextField
                  label="หมายเหตุ"
                  fullWidth
                  multiline
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)} // อัปเดตสถานะเมื่อผู้ใช้กรอกข้อความ
                  placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
                />
              </Box>     
              </Box>
            )}
           
           
          </Box>
          {alertMessage && (
            <Box mt={2}>
              <Typography variant="subtitle1" color="error">
                {alertMessage}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ยกเลิก</Button>
          <Button onClick={handleConfirmSave} color="primary">
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmationOpen}
        onClose={handleConfirmClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>ยืนยันการบันทึก</DialogTitle>
        <DialogContent>
          <Typography>คุณต้องการบันทึกข้อมูลวัคซีนหรือไม่?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose}>ยกเลิก</Button>
          <Button onClick={saveVaccineSelection} color="primary">
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message="บันทึกวัคซีนสำเร็จ!"
      />
    </LocalizationProvider>
  );
};

export default ChooseVac;
