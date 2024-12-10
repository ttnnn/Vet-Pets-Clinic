const cron = require('node-cron');
const dayjs = require('dayjs');
const axios = require('axios');

 // Replace with your actual API endpoint
const api = 'http://localhost:8080';
// Function to fetch appointments from the database
const fetchAppointments = async () => {
  try {
    const response = await axios.get(`${api}/appointment`);
    return response.data; // Return the fetched data
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
};

// Function to update the status of an appointment
const updateAppointmentStatus = async (appointment_id, statusUpdates) => {
  try {
    await axios.put(`${api}/appointment/${appointment_id}`, statusUpdates);
    console.log(`Updated appointment ${appointment_id} to status: ${statusUpdates.status}`);
  } catch (error) {
    console.error('Error updating appointment:', error);
  }
};

// Function to cancel past appointments
const cancelPastAppointments = async () => {
  console.log(`Cron Job running at ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);

  const appointments = await fetchAppointments();

  appointments.forEach((appointment) => {
    const { appointmentDate, appointmentTime, id, status } = appointment;

    if (status !== 'ยกเลิกนัด') {
      const timeWithoutOffset = appointmentTime
        ? appointmentTime.split('+')[0]
        : "20:00:00"; // Default closing time if appointmentTime is missing

      const appointmentDateTime = dayjs(
        `${dayjs(appointmentDate).format('YYYY-MM-DD')}T${timeWithoutOffset}`
      );

      if (appointmentDateTime.isBefore(dayjs())) {
        updateAppointmentStatus(id, { status: 'ยกเลิกนัด', queue_status: 'ยกเลิกนัด' });
      }
    }
  });
};

// Schedule the Cron Job to run every day at 20:00
cron.schedule('0 20 * * *', cancelPastAppointments);
