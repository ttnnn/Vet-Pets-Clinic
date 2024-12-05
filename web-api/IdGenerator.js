const categoryCodeMapping = {
  'อาบน้ำ-ตัดขน': 'GM',
  'ตรวจรักษา': 'TX',
  'ฝากเลี้ยง': 'PH',
  'วัคซีน': 'VC'
};

// Function to generate the next AppointmentID
const generateAppointmentID = async (db, type_service) => {
  if (!type_service || !categoryCodeMapping[type_service]) {
    throw new Error('Invalid category selected');
  }

  const categoryCode = categoryCodeMapping[type_service];
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE appointment IN SHARE ROW EXCLUSIVE MODE');

    let queryLatestId = `SELECT appointment_id FROM appointment WHERE appointment_id LIKE '${categoryCode}-%' ORDER BY appointment_id DESC LIMIT 1`;
    const { rows } = await client.query(queryLatestId);
    let latestAppointmentID = rows.length > 0 ? rows[0].appointment_id : `${categoryCode}-00000`;

    let lastNumber = parseInt(latestAppointmentID.split('-')[1], 10);
    let nextNumber = lastNumber + 1;
    let newAppointmentID = `${categoryCode}-${nextNumber.toString().padStart(5, '0')}`;

    // ตรวจสอบว่า `newAppointmentID` ซ้ำไหม
    let checkIfExists = `SELECT 1 FROM appointment WHERE appointment_id = $1 LIMIT 1`;
    const existsResult = await client.query(checkIfExists, [newAppointmentID]);

    if (existsResult.rowCount > 0) {
      // ถ้ารหัสซ้ำ ให้ทำการเพิ่มไปอีกจนกว่าจะไม่ซ้ำ
      nextNumber++;
      newAppointmentID = `${categoryCode}-${nextNumber.toString().padStart(5, '0')}`;
    }

    await client.query('COMMIT');
    return newAppointmentID;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
module.exports = { generateAppointmentID };