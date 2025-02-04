import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
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

const api = 'http://localhost:8080/api/clinic';
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

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [petType, setPetType] = useState('all');
  const [timeFilter, setTimeFilter] = useState('year');
  const [year, setYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const serviceTypes = ['อาบน้ำ-ตัดขน', 'ตรวจรักษา', 'วัคซีน', 'ฝากเลี้ยง'];

  useEffect(() => {
    axios
      .get(`${api}/dashboard`, {
        params: { petType, timeFilter, year: timeFilter === 'year' ? year : undefined },
      })
      .then((response) => setData(response.data))
      .catch((error) => console.error(error));
  }, [petType, timeFilter, year]);

  useEffect(() => {
    axios
      .get(`${api}/available-years`)
      .then((response) => {
        const fetchedYears = response.data.years;
        setAvailableYears(fetchedYears);
        if (!fetchedYears.includes(year)) {
          setYear(fetchedYears[0]);
        }
      })
      .catch((error) => console.error(error));
  }, [year]);

  if (!data) return <Typography>Loading...</Typography>;

  const petsPerPeriodChartData = {
    labels: data.petsPerPeriod.map((item) => item.period),
    datasets: [
      {
        label: 'จำนวนสัตว์เลี้ยง',
        data: data.petsPerPeriod.map((item) => item.count),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const revenueChartData = {
    labels: data.revenue.map((item) => item.period),
    datasets: [
      {
        label: 'รายได้ (฿)',
        data: data.revenue.map((item) => item.amount),
        borderColor: 'rgba(75, 192, 192, 0.6)',
        fill: false,
      },
    ],
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f0f0f0', minHeight: '100vh' }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          bgcolor: '#f0f0f0',
        }}
      >
        <Box
          sx={{
            bgcolor: 'white',
            boxShadow: 3,
            borderRadius: 2,
            p: 3,
            width: '100%',
            maxWidth: '1200px',
          }}
        >
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

          <Grid container spacing={3} marginBottom={3}>
            {serviceTypes.map((type) => {
              const service = data.services.find((service) => service.type === type);

              return (
                <Grid item xs={12} sm={4} key={type}>
                  <Card sx={{ height: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <CardContent>
                      <Typography variant="h5">{service ? service.type : type}</Typography>
                      <Typography variant="h6">
                        {service && service.count != null ? service.count : 0} รายการ
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
             <Card sx={{ height: '400px' }}>
                <CardContent>
                  <Typography variant="h6">จำนวนสัตว์เลี้ยงที่มาเข้าใช้บริการต่อเดือน</Typography>
                  <Bar data={petsPerPeriodChartData} options={{ responsive: true }} />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '400px' }}>
                <CardContent>
                  <Typography variant="h6">รายได้ต่อเดือน</Typography>
                  <Line data={revenueChartData} />
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
