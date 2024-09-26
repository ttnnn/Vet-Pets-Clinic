const categoryCodeMapping = {
    'อาบน้ำ-ตัดขน': 'GM',
    'ตรวจรักษา': 'TM',
    'ฝากเลี้ยง': 'PH',
    'วัคซีน': 'VC'
  };
  
  // Function to generate the next AppointmentID
  const generateAppointmentID = (db, TypeService, callback) => {
    if (!TypeService || !categoryCodeMapping[TypeService]) {
      return callback(new Error('Invalid category selected'));
    }
  
    const categoryCode = categoryCodeMapping[TypeService];
  
    // Query to find the latest AppointmentID for the selected category
    const queryLatestId = `SELECT AppointmentID FROM appointment WHERE AppointmentID LIKE '${categoryCode}-%' ORDER BY AppointmentID DESC LIMIT 1`;
  
    db.query(queryLatestId, (err, results) => {
      if (err) {
        console.error('Error fetching latest appointment ID:', err);
        return callback(err);
      }
  
      // Generate the next AppointmentID
      const latestAppointmentID = results.length > 0 ? results[0].AppointmentID : `${categoryCode}-00000`;
      const lastNumber = parseInt(latestAppointmentID.split('-')[1], 10);
      const nextNumber = lastNumber + 1;
      const newAppointmentID = `${categoryCode}-${nextNumber.toString().padStart(5, '0')}`;
  
      callback(null, newAppointmentID);
    });
  };
  
  module.exports = { generateAppointmentID };
  