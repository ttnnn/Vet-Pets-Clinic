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
  const today = new Date();
  const datePart = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

  const prefix = `${categoryCode}-${datePart}`;
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE appointment IN SHARE ROW EXCLUSIVE MODE');

    const query = `
      SELECT appointment_id
      FROM appointment
      WHERE appointment_id LIKE '${prefix}%' 
      ORDER BY appointment_id DESC
      LIMIT 1
    `;
    const { rows } = await client.query(query);

    let lastNumber = 0;
    if (rows.length > 0) {
      const lastId = rows[0].appointment_id;
      const lastSuffix = parseInt(lastId.slice(-2), 10); // ดึงเลขท้าย 2 ตัว
      lastNumber = isNaN(lastSuffix) ? 0 : lastSuffix;
    }

    const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
    const newAppointmentID = `${prefix}${nextNumber}`;

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
