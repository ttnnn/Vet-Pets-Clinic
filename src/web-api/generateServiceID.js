const categoryCodeMapping = {
    'รายการยา': 'MD',
    'ค่าLab': 'LB',
    'ตรวจรักษา': 'TX',
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
  
    const categoryCode = categoryCodeMapping[category_type]; // แก้ไขตรงนี้
    const client = await db.connect();
  
    try {
      await client.query('BEGIN');
      await client.query('LOCK TABLE servicecategory IN SHARE ROW EXCLUSIVE MODE'); // ตรวจสอบให้แน่ใจว่าชื่อตารางตรงกับฐานข้อมูล
  
      let queryLatestId = `SELECT category_id FROM servicecategory WHERE category_id LIKE '${categoryCode}-%' ORDER BY category_id DESC LIMIT 1`; // ตรวจสอบให้แน่ใจว่าชื่อตารางตรงกับฐานข้อมูล
      const { rows } = await client.query(queryLatestId);
      let latestServiceID = rows.length > 0 ? rows[0].category_id : `${categoryCode}-00000`;
  
      let lastNumber = parseInt(latestServiceID.split('-')[1], 10);
      let nextNumber = lastNumber + 1;
      let newServiceID = `${categoryCode}-${nextNumber.toString().padStart(3, '0')}`;
  
      // ตรวจสอบว่า `newServiceID` ซ้ำไหม
      let checkIfExists = `SELECT 1 FROM servicecategory WHERE category_id = $1 LIMIT 1`; // ตรวจสอบให้แน่ใจว่าชื่อตารางตรงกับฐานข้อมูล
      const existsResult = await client.query(checkIfExists, [newServiceID]);
  
      if (existsResult.rowCount > 0) {
        // ถ้ารหัสซ้ำ ให้ทำการเพิ่มไปอีกจนกว่าจะไม่ซ้ำ
        nextNumber++;
        newServiceID = `${categoryCode}-${nextNumber.toString().padStart(5, '0')}`;
      }
  
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
  