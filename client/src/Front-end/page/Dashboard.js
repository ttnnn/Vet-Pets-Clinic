import React, { useEffect, useState, useRef } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
  Skeleton
} from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';
import Sidebar from './Sidebar';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
} from 'chart.js';
import { clinicAPI } from "../../utils/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  LineElement
);

const monthNames = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [petType, setPetType] = useState('all');
  const [timeFilter, setTimeFilter] = useState('year');
  const [year, setYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const serviceTypes = ['อาบน้ำ-ตัดขน', 'ตรวจรักษา', 'วัคซีน', 'ฝากเลี้ยง'];
  const fetchedYearsRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    clinicAPI
      .get('dashboard', {
        params: { petType, timeFilter, year: timeFilter === 'year' ? year : undefined },
      })
      .then((response) => {
        //console.log("API Response:", response.data);
        setData(response.data);
      })
      .catch((error) => console.error("API Error:", error))
      .finally(() => setLoading(false));
  }, [petType, timeFilter, year]);

  useEffect(() => {
    if (!fetchedYearsRef.current) {
      fetchedYearsRef.current = true;
      clinicAPI
        .get('/available-years')
        .then((response) => {
          const fetchedYears = response.data.years;
          setAvailableYears(fetchedYears);
          if (!fetchedYears.includes(year)) {
            setYear(fetchedYears[0]);
          }
        })
        .catch((error) => console.error(error));
    }
  }, [year]);

  return (
    <Box display="flex" sx={{ height: '100%', width: '100%', minHeight: '100vh', backgroundColor: '#e0e0e0' }}>
      {/* ✅ Sidebar จะแสดงขึ้นก่อน */}
      <Sidebar />

      <Box component="main" sx={{ flexGrow: 1, p: 3, display: 'flex', justifyContent: 'center', bgcolor: '#f0f0f0' }}>
        <Box sx={{ bgcolor: 'white', boxShadow: 3, borderRadius: 2, p: 3, width: '100%', maxWidth: '1200px' }}>
          
          {/* Dropdown Filters */}
          <Grid container spacing={2} marginBottom={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>ประเภทสัตว์เลี้ยง</InputLabel>
                <Select value={petType} onChange={(e) => setPetType(e.target.value)}>
                  <MenuItem value="all">ทั้งหมด</MenuItem>
                  <MenuItem value="สุนัข">สุนัข</MenuItem>
                  <MenuItem value="แมว">แมว</MenuItem>
                  <MenuItem value="other">อื่นๆ</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>เลือกช่วงเวลา</InputLabel>
                <Select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
                  <MenuItem value="year">ปี</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {timeFilter === 'year' && (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>ปี</InputLabel>
                  <Select value={year} onChange={(e) => setYear(e.target.value)}>
                    {availableYears.map((y) => (
                      <MenuItem key={y} value={y}>
                        {y}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>

          {/* ✅ แสดง UI หลักก่อน โหลดข้อมูลทีหลัง */}
          <Grid container spacing={3} marginBottom={3}>
            {serviceTypes.map((type) => {
              const service = data?.services?.find((service) => service.type === type);

              return (
                <Grid item xs={12} sm={4} key={type}>
                  <Card sx={{ height: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <CardContent>
                      <Typography variant="h5">{type}</Typography>
                      {loading ? (
                        <Skeleton variant="text" width="50%" height={30} />
                      ) : (
                        <Typography variant="h6">
                          {service?.count ?? 0} รายการ
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* ✅ โหลดเฉพาะกราฟทีหลัง */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '400px' }}>
                <CardContent>
                  <Typography variant="h6">จำนวนสัตว์เลี้ยงที่มาเข้าใช้บริการต่อเดือน</Typography>
                  {loading ? (
                    <Skeleton variant="rectangular" width="100%" height={300} />
                  ) : (
                    <Bar
                      data={{
                        labels: data?.petsPerPeriod?.map((item) => monthNames[parseInt(item.period) - 1]) || [],
                        datasets: [{
                          label: 'จำนวนสัตว์เลี้ยง',
                          data: data?.petsPerPeriod?.map((item) => item.count) || [],
                          backgroundColor: 'rgba(54, 162, 235, 0.6)',
                          borderColor: 'rgba(54, 162, 235, 1)',
                          borderWidth: 1,
                        }]
                      }}
                      options={{ responsive: true }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '400px' }}>
                <CardContent>
                  <Typography variant="h6">รายได้ต่อเดือน</Typography>
                  {loading ? (
                    <Skeleton variant="rectangular" width="100%" height={300} />
                  ) : (
                    <Line
                      data={{
                        labels: data?.revenue?.map((item) => monthNames[parseInt(item.period) - 1]) || [],
                        datasets: [{
                          label: 'รายได้ (฿)',
                          data: data?.revenue?.map((item) => item.amount) || [],
                          borderColor: 'rgba(75, 192, 192, 0.6)',
                          fill: false,
                        }]
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
