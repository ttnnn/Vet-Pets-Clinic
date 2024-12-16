import React, { useState, useEffect } from 'react'; 
import FolderIcon from '@mui/icons-material/Folder';
import {
  Box,
  Typography,
  Button,
  Collapse,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

import dayjs from 'dayjs';
import 'dayjs/locale/th';
import axios from 'axios';
dayjs.locale('th');

const api = 'http://localhost:8080/api/clinic';

// ปุ่มเพิ่มบันทึก
const AddRecordButton = ({ onClick }) => (
  <Button variant="contained" color="primary" size="small" onClick={onClick}>
    เพิ่มบันทึก
  </Button>
);

// ปุ่มดู/ซ่อนรายละเอียด
const ViewDetailsButton = ({ onClick, isExpanded }) => (
  <Button variant="text" size="small" onClick={onClick}>
    {isExpanded ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
  </Button>
);

// ฟอร์แมตรูปแบบวันที่
const formatDate = (dateString) => dayjs(dateString).format('DD MMMM YYYY');

const CardLayout = () => {
  const [records, setRecords] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // ดึงข้อมูลจาก API
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await axios.get(`${api}/admitrecord`, {
          params: { appointment_id: appointmentId }, // ส่ง appointment_id ใน query string
        }) // ตัวอย่างการกรองด้วย appointment_id
        const data = await response.json();
        
        // กรองข้อมูลให้เลขนัดหมายที่ซ้ำกันแสดงแค่ครั้งเดียว
        const filteredRecords = data.data.reduce((acc, record) => {
          if (!acc.some((r) => r.appointment_id === record.appointment_id)) {
            acc.push(record);
          }
          return acc;
        }, []);
        
        setRecords(filteredRecords);
      } catch (error) {
        console.error("Error fetching records:", error);
      }
    };

    fetchRecords();
  }, []);

  // ฟังก์ชันเปิด/ปิดดูรายละเอียด
  const toggleDetails = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      border="1px solid #ddd"
      borderRadius="8px"
      padding="16px"
      marginBottom="8px"
      backgroundColor="#f9f9f9"
    >
      {/* Main card content */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <FolderIcon style={{ marginRight: '12px', color: '#757575' }} />
          <Typography variant="body1" fontWeight="bold">
            Admit: {formatDate(dayjs())}
          </Typography>
        </Box>
        <Box display="flex" gap="8px">
          <AddRecordButton onClick={() => {}} />
          <ViewDetailsButton onClick={toggleDetails} isExpanded={isExpanded} />
        </Box>
      </Box>

      {/* Sub-cards section */}
      <Collapse in={isExpanded}>
        <List>
          {records.length > 0 ? (
            records.map((record) => (
              <ListItem key={record.appointment_id}>
                <ListItemText
                  primary={`วันที่บันทึก: ${formatDate(record.rec_date)}`}
                  secondary={`รายละเอียด: ${record.record_medical}`}
                />
              </ListItem>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary" padding="8px">
              ยังไม่มีการบันทึก
            </Typography>
          )}
        </List>
      </Collapse>
    </Box>
  );
};

export default CardLayout;
