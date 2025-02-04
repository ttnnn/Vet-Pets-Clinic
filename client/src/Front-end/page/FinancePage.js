import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  TablePagination,
  Snackbar,
  Alert,
  Dialog,
  Button
} from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from './Sidebar';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import ReceiptComponent from '../component/ReceiptComponent';
import DownloadIcon from '@mui/icons-material/Download';
import { CircularProgress } from '@mui/material';
import ExportFinanceToExcel from '../component/ExportFinanceToExcel';


dayjs.locale('th');

const api = 'http://localhost:8080/api/clinic';
const CategoryContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
}));

const FormRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '20px',
});

const FinancePage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [DataFinance, setDataFinance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [loadingId, setLoadingId] = useState(null); // เก็บ id ของปุ่มที่กด


  const resetPage = () => setPage(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${api}/finance`);
      setDataFinance(response.data);
    } catch (error) {
      console.error('Error fetching DataFinance:', error);
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการโหลดข้อมูล', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    resetPage();
  };

  const handleChangeTab = (event, newValue) => {
    setActiveTab(newValue);
    resetPage();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };


  const handleOpenDialog = (receipt) => {
    setLoadingId(receipt.invoice_id); // ตั้งค่าปุ่มที่กำลังโหลด
    setTimeout(() => {
      setLoadingId(null); // รีเซ็ตเมื่อโหลดเสร็จ
      setSelectedReceipt(receipt); // หรือทำสิ่งที่ต้องการหลังโหลด
      setOpenDialog(true);
    }, 1000); // ระยะเวลาการโหลด (สมมติ)
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedReceipt(null);
  };

  const filteredData = DataFinance.filter((service) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      service.appointment_id.toLowerCase().includes(searchLower) ||
      service.fullname.toLowerCase().includes(searchLower)
    );
  }).filter((service) => {
    if (activeTab === 0) return service.status_pay === 'Paid';
    return true;
  });

  const paginatedCategories = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box display="flex" sx={{ height: '100%', width: '100%', minHeight: '100vh', backgroundColor: '#e0e0e0' }}>
      <Sidebar />
      <CategoryContainer>
        <Paper sx={{ width: '100%' }}>
       
          <Box p={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Tabs value={activeTab} onChange={handleChangeTab} indicatorColor="primary" textColor="primary">
              <Tab label="ประวัติการชำระ" />
            </Tabs>
            {activeTab === 0 && (<ExportFinanceToExcel filteredAppointments={DataFinance} />)}
            </Box>
            <FormRow sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
                <TextField
                  placeholder="ค้นหาเลขที่นัดหมาย หรือ ชื่อลูกค้า"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  variant="outlined"
                  sx={{ flex: 1, minWidth: 250 }}
                />
              </Box>
            </FormRow>
            {loading ? (
              <Typography>กำลังโหลดข้อมูล...</Typography>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: '600px', overflow: 'auto', borderRadius: 2, boxShadow: 3 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px' }}>รหัสชำระเงิน</TableCell>
                      <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px' }}>เลขที่นัดหมาย</TableCell>
                      <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px' }}>ชื่อลูกค้า</TableCell>
                      <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px' }}>ยอดชำระ</TableCell>
                      <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px' }}>สถานะ</TableCell>
                      {activeTab === 0 && (
                        <>
                      <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px' }}>ดาวน์โหลด</TableCell>
                      <TableCell align="center" sx={{ backgroundColor: '#e0e0e0', fontWeight: 'bold', fontSize: '16px' }}></TableCell>
                      </>
                      )}
                      
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedCategories.map((service) => (
                      <TableRow key={service.invoice_id}>
                        <TableCell align="center" >#{service.payment_id}-{dayjs(service.invoice_date).format('YYYYMMDD')}</TableCell>
                        <TableCell align="center">{service.appointment_id}</TableCell>
                        <TableCell align="center">{service.fullname}</TableCell>
                        <TableCell align="center">{service.total_pay_invoice} บาท</TableCell>
                        <TableCell align="center">{service.status_pay}</TableCell>
                        {activeTab === 0 && (
                           <TableCell align="center">
                            <Button
                              onClick={() => handleOpenDialog({...service,isPending: true})}
                              disabled={loadingId === service.invoice_id}
                            >
                              {loadingId === service.invoice_id ? (
                                <CircularProgress size={24} style={{ color: '#e0e0e0' }} />
                              ) : (
                                <DownloadIcon /> // ไอคอนดาวน์โหลดปกติ
                              )}
                            </Button>
                          </TableCell>
                         
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <TablePagination
              rowsPerPageOptions={[10, 25]}
              component="div"
              count={filteredData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Box>
        </Paper>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md">
          {selectedReceipt && <ReceiptComponent receiptData={selectedReceipt} isPending={selectedReceipt.isPending || false} />}
      
      </Dialog>
      
      </CategoryContainer>
    </Box>
  );
};

export default FinancePage;
