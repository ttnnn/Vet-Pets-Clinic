const categoryCodeMapping = {
  'รายการยา': 'MD',
  'ค่าLab': 'LB',
  'ค่าตรวจรักษา': 'TX',
  'อุปกรณ์และเวชภัณฑ์': 'EQ',
  'ค่าบริการอื่นๆ': 'OT',
  'น้ำเกลือ': 'NS',
  'ผ่าตัด': 'OP',
  'ค่าบริการทางการแพทย์': 'MS',
  'ฝากเลี้ยง': 'PH',
  'อาบน้ำ-ตัดขน': 'GM',
  'อาหาร': 'FD',
};

// Function to generate the next Service ID
const generateServiceID = async (db, category_type) => {
  if (!category_type || !categoryCodeMapping[category_type]) {
    throw new Error('Invalid category selected');
  }

  const categoryCode = categoryCodeMapping[category_type];
  const today = new Date();
  const formattedDate = today.toISOString().slice(0, 10).replace(/-/g, ''); // yyyyMMdd

  const prefix = `${categoryCode}-${formattedDate}`;

  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE servicecategory IN SHARE ROW EXCLUSIVE MODE');

    // Find latest ID with today’s prefix
    const queryLatestId = `
      SELECT category_id FROM servicecategory 
      WHERE category_id LIKE '${prefix}%' 
      ORDER BY category_id DESC 
      LIMIT 1
    `;
    const { rows } = await client.query(queryLatestId);

    let lastNumber = 0;
    if (rows.length > 0) {
      const latestId = rows[0].category_id;
      const numericPart = latestId.slice(prefix.length); // Get part after prefix
      lastNumber = parseInt(numericPart, 10);
    }

    let nextNumber = lastNumber + 1;
    const runningNumber = nextNumber.toString().padStart(2, '0');
    const newServiceID = `${prefix}${runningNumber}`;

    await client.query('COMMIT');
    return newServiceID;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { generateServiceID };
