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
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
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


const today = new Date();
const thaiDate = new Intl.DateTimeFormat('th-TH', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).format(today);

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
  const [dailyRevenue, setDailyRevenue] = useState(0);

  useEffect(() => {
    const thaiDate = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DD');
    //console.log('thaiDate',thaiDate)
    clinicAPI
      .get('/dashboard/daily-revenue', { params: { date: thaiDate } })
      .then((response) => {
        //console.log('Daily Revenue Response:', response.data.revenue);
        setDailyRevenue(response.data.revenue);
      })
      .catch((error) => console.error("Error fetching daily revenue:", error));
  }, []);
  
  useEffect(() => {
    setLoading(true);
    const params = {
      petType,
      timeFilter,
      year: timeFilter === 'year' ? String(year) : undefined,
    };
    
    clinicAPI
      .get('dashboard', {params})
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
      {/* Sidebar จะแสดงขึ้นก่อน */}
      <Sidebar />

      <Box component="main" sx={{ flexGrow: 1, p: 3, display: 'flex', justifyContent: 'center', bgcolor: '#f0f0f0' }}>
        <Box sx={{ bgcolor: 'white', boxShadow: 3, borderRadius: 2, p: 3, width: '100%', maxWidth: '1200px' }}>
        <Typography variant="h4" gutterBottom> สถิติการใช้บริการ </Typography>
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

          {/*แสดง UI หลักก่อน โหลดข้อมูลทีหลัง */}
          <Grid container spacing={3} marginBottom={3}>
            {serviceTypes.map((type) => {
              const service = data?.services?.find((service) => service.type === type);
              const typeColors = {
                'อาบน้ำ-ตัดขน': '#e1bee7',
                'ตรวจรักษา': '#d1c4e9' ,
                'วัคซีน': '#c5cae9' ,
                'ฝากเลี้ยง': '#d0d9ff',
              };
              return (
                <Grid item xs={12} sm={4} key={type}>
                  <Card sx={{
                     height: '100px',
                     display: 'flex', 
                     flexDirection: 'column', 
                     justifyContent: 'space-between' ,
                     backgroundColor: typeColors[type] || 'white'}}>
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
                  <Grid item xs={12} sm={4}>
                </Grid>
                    

                </Grid>
              );
            })}
             <Grid item xs={12} sm={4}>
              <Card
                sx={{
                  height: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: '#c8e6c9',
                }}
              >
                <CardContent>
                  <Typography variant="h5">รายได้วันนี้</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {thaiDate}
                  </Typography>
                  {loading || dailyRevenue === null ? (
                    <Skeleton variant="text" width="50%" height={30} />
                  ) : (
                    <Typography variant="h6">
                      ฿{dailyRevenue !== undefined
                        ? dailyRevenue.toLocaleString('th-TH')
                        : '-'}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
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
                          backgroundColor: 'rgba(171, 116, 188, 0.6)',
                          borderColor: 'rgb(171, 91, 155)',
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
                          borderColor: 'rgba(171, 116, 188, 0.6)',
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
