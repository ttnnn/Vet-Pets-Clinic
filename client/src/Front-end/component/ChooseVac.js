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
  TextField,CircularProgress
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { clinicAPI } from "../../utils/api";
dayjs.locale("th");


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
  const [selectedVaccines, setSelectedVaccines] = useState([]);
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
          const response = await clinicAPI.get(`/vaccines`);
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
        const appointmentResponse = await clinicAPI.get(
          `/appointments/${appointmentId}`
        );
        const petResponse = await clinicAPI.get(`/pets/${petId}`);
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
    setSelectedVaccines([]);
    setAlertMessage("");
    setNote("");
  };

  const saveVaccineSelection = async () => {
    if (selectedVaccines.length === 0) {
      setAlertMessage("กรุณาเลือกวัคซีนก่อนบันทึก");
      return;
    }
    setLoading(true); 
    try {
      const response = await clinicAPI.post(
        `/appointments/${appointmentId}/vaccines`,
        {
          pet_id: petId,
          vaccine_id: selectedVaccines,
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
    }finally {
      setLoading(false); }
  };

  const handleConfirmSave = () => {
    setConfirmationOpen(true);
  };

  const handleConfirmClose = () => {
    setConfirmationOpen(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth  BackdropProps={{ sx: { backgroundColor: "transparent" } }} >
        <DialogTitle>เลือกวัคซีน</DialogTitle>

        <DialogContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
                height: "350px",
              }}
            >
              {TypeService === "วัคซีน" && vaccineList?.length > 0 && (
                <Box sx={{ flex: "1", maxWidth: "400px" }}>
                  <Autocomplete
                    multiple
                    disablePortal
                    options={vaccineList}
                    getOptionLabel={(option) => option.category_name}
                    onChange={(event, newValue) =>
                      setSelectedVaccines(newValue.map(vaccine => vaccine.category_id))
                    }
                    value={vaccineList.filter(vaccine => (selectedVaccines || []).includes(vaccine.category_id))}
                    sx={{ width: "100%" }}
                    renderInput={(params) => (
                      <TextField {...params} label="เลือกวัคซีน" disabled={loading} />
                    )}
                  />
                </Box>
              )}

              {appointmentDetails && petDetails && (
                <Box sx={{ flex: "1", maxWidth: "400px" }}>
                  <Typography variant="h6">ข้อมูลนัดหมาย</Typography>
                  <Typography>
                    วันที่นัดหมาย:{" "}
                    {appointmentDetails.appointment_date
                      ? dayjs(appointmentDetails.appointment_date).format("DD MMMM YYYY")
                      : "-"}
                  </Typography>
                  <Typography>
                    ประเภทบริการ: {appointmentDetails.type_service || "-"}
                  </Typography>
                  <Typography>
                    หมายเหตุ: {appointmentDetails.reason || "-"}
                  </Typography>
                    
                  <Typography variant="h6" mt={2}>
                    ข้อมูลสัตว์เลี้ยง
                  </Typography>
                  <Typography>ชื่อสัตว์เลี้ยง: {petDetails.pet_name || "-"}</Typography>
                  <Typography>ประเภทสัตว์: {petDetails.pet_species || "-"}</Typography>
                    
                  {selectedVaccines?.length > 0 ? (
                    <Box mt={2}>
                      <Typography variant="subtitle1" color="blue">
                        คุณเลือกวัคซีน:{" "}
                        {vaccineList
                          ?.filter((vaccine) => selectedVaccines.includes(vaccine.category_id))
                          .map((vaccine) => vaccine.category_name)
                          .join(", ") || "-"}
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
                      value={note || ""}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
                    />
                  </Box>
                </Box>
              )}
            </Box>
          )}

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
        BackdropProps={{ sx: { backgroundColor: "transparent" } }}

      >
        <DialogTitle>ยืนยันการบันทึก</DialogTitle>
        <DialogContent>
          <Typography>คุณต้องการบันทึกข้อมูลวัคซีนหรือไม่?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose}>ยกเลิก</Button>
          <Button
            onClick={saveVaccineSelection}
            color="primary"
            disabled={loading}  // Disable the button while loading
          >
            {loading ? <CircularProgress size={24} /> : 'บันทึก'}
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
