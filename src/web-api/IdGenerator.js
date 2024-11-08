const categoryCodeMapping = {
  'อาบน้ำ-ตัดขน': 'GM',
  'ตรวจรักษา': 'TX',
  'ฝากเลี้ยง': 'PH',
  'วัคซีน': 'VC'
};

// Function to generate the next AppointmentID
const generateAppointmentID = (db, type_service) => {
  return new Promise((resolve, reject) => {
    if (!type_service || !categoryCodeMapping[type_service]) {
      return reject(new Error('Invalid category selected'));
    }

    const categoryCode = categoryCodeMapping[type_service];

    // Query to find the latest AppointmentID for the selected category
    const queryLatestId = `SELECT appointment_id FROM appointment WHERE appointment_id LIKE '${categoryCode}-%' ORDER BY appointment_id DESC LIMIT 1`;

    db.query(queryLatestId, (err, results) => {
      if (err) {
        console.error('Error fetching latest appointment ID:', err);
        return reject(err);
      }

      // Generate the next AppointmentID
      const latestAppointmentID = results.length > 0 ? results[0].appointment_id : `${categoryCode}-00000`;
      const lastNumber = parseInt(latestAppointmentID.split('-')[1], 10);
      const nextNumber = lastNumber + 1;
      const newAppointmentID = `${categoryCode}-${nextNumber.toString().padStart(5, '0')}`;

      resolve(newAppointmentID);
    });
  });
};

module.exports = { generateAppointmentID };
