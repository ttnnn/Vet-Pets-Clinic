import React, { useState } from "react";
import { Box, Button, Typography, MenuItem, TextField, Paper } from "@mui/material";

const Bodyscore = ({onSubmit}) => {
  const [formData, setFormData] = useState({
    ribs: '',
    subcutaneousFat: '',
    abdomen: '',
    waist: '',
    result_bcs:''
  });
  const [result, setResult] = useState("");
  const [errors, setErrors] = useState({
    ribs: false,
    subcutaneousFat: false,
    abdomen: false,
    waist: false,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: parseInt(e.target.value) });
    setErrors({ ...errors, [e.target.name]: false });
  };
  const valueToText = {
    1: "มองเห็นได้ชัดเจน",
    2: "มองเห็นได้บางส่วน",
    3: "คลำได้แต่มองไม่เห็น",
    4: "มองไม่เห็นคลำไม่ได้"
  };
  

  const handleSubmit = () => {
    const { ribs, subcutaneousFat, abdomen, waist } = formData;

    // ตรวจสอบว่ากรอกข้อมูลครบหรือไม่
    const newErrors = {
        ribs: !ribs,
        subcutaneousFat: !subcutaneousFat,
        abdomen: !abdomen,
        waist: !waist,
      };
  
      setErrors(newErrors);
  
      if (Object.values(newErrors).includes(true)) {
        return; // หากมีข้อผิดพลาดไม่ให้ประเมินผล
      }
  


   // แปลงค่าตัวเลขเป็นข้อความ
   const ribsText = valueToText[ribs];
   const subcutaneousFatText = valueToText[subcutaneousFat];
   const abdomenText = valueToText[abdomen];
   const waistText = valueToText[waist];
    // นับจำนวนที่ตรงกันในแต่ละผลลัพธ์
    const results = [
      { name: "ผอมมาก", count: 0 },
      { name: "ผอม", count: 0 },
      { name: "หุ่นดี", count: 0 },
      { name: "อ้วน", count: 0 },
      { name: "อ้วนมาก", count: 0 },
    ];
  
    // เงื่อนไขสำหรับแต่ละผลลัพธ์
    const conditions = [
      { name: "ผอมมาก", values: [1, 1, 1, 1] },
      { name: "ผอม", values: [2, 2, 2, 2] },
      { name: "หุ่นดี", values: [3, 2, 2, 2] },
      { name: "น้ำหนักเกิน", values: [3, 3, 3, 3] },
      { name: "อ้วน", values: [4, 3, 3, 4] },
    ];
  
    // ตรวจสอบค่าที่ตรงกัน
    conditions.forEach((condition, index) => {
      const { values } = condition;
      const matches = [
        ribs === values[0],
        subcutaneousFat === values[1],
        abdomen === values[2],
        waist === values[3],
      ];
      results[index].count = matches.filter(Boolean).length; // นับจำนวนที่ตรง
    });
  
    // หาผลลัพธ์ที่มีจำนวนตรงกันมากที่สุด
    const bestResult = results.reduce((prev, current) =>
      prev.count > current.count ? prev : current
    );
  
    setResult(bestResult.name);

    // ส่งค่ากลับไปยังหน้าหลัก
   // ส่งค่าผลลัพธ์กลับไปหน้าหลัก
   if (onSubmit) {
    onSubmit({ 
      ...formData, 
      ribs: ribsText,        // ส่งค่าที่แปลงเป็นข้อความ
      subcutaneous_fat: subcutaneousFatText, 
      abdomen: abdomenText, 
      waist: waistText, 
      result_bcs: bestResult.name 
    });
  }
  };
  
  
  return (
    <Box sx={{ maxWidth: 600, margin: "auto", padding: 4 }}>
      <Paper sx={{ padding: 3, marginBottom: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            select
            label="การมองเห็นกระดูกซี่โครง"
            name="ribs"
            value={formData.ribs}
            onChange={handleChange}
            error={errors.ribs}
            helperText={errors.ribs ? "กรุณากรอกข้อมูล" : ""}
          >
            <MenuItem value={1}>มองเห็นได้ชัดเจน</MenuItem>
            <MenuItem value={2}>มองเห็นได้บางส่วน</MenuItem>
            <MenuItem value={3}>คลำได้แต่มองไม่เห็น</MenuItem>
            <MenuItem value={4}>มองไม่เห็นคลำไม่ได้</MenuItem>
          </TextField>

          <TextField
            select
            label="ไขมันใต้ผิวหนัง"
            name="subcutaneousFat"
            value={formData.subcutaneousFat}
            onChange={handleChange}
            error={errors.subcutaneousFat}
            helperText={errors.subcutaneousFat ? "กรุณากรอกข้อมูล" : ""}
          >
            <MenuItem value={1}>ไม่มีไขมัน</MenuItem>
            <MenuItem value={2}>มีไขมันปกคลุมเล็กน้อย</MenuItem>
            <MenuItem value={3}>มีไขมันปกคลุมหนา</MenuItem>
          </TextField>

          <TextField
            select
            label="ลักษณะท้อง"
            name="abdomen"
            value={formData.abdomen}
            onChange={handleChange}
            error={errors.abdomen}
            helperText={errors.abdomen ? "กรุณากรอกข้อมูล" : ""}
          >
            <MenuItem value={1}>ท้องลีบ</MenuItem>
            <MenuItem value={2}>ท้องแฟบ</MenuItem>
            <MenuItem value={3}>พุงย้อย</MenuItem>
          </TextField>

          <TextField
            select
            label="ลักษณะเอว"
            name="waist"
            value={formData.waist}
            onChange={handleChange}
            error={errors.waist}
            helperText={errors.waist ? "กรุณากรอกข้อมูล" : ""}
          >
            <MenuItem value={1}>เอวกิ่วมาก</MenuItem>
            <MenuItem value={2}>เอวคอด</MenuItem>
            <MenuItem value={3}>ไม่มีเอว</MenuItem>
            <MenuItem value={4}>เอวใหญ่</MenuItem>
          </TextField>

          <Button variant="contained" color="primary" onClick={handleSubmit}>
            ประเมินผล
          </Button>
        </Box>
      </Paper>

      {result && (
        <Typography variant="h7" sx={{ textAlign: "center"}}>
          ผลลัพธ์: {result}
        </Typography>
      )}
    </Box>
  );
};

export default Bodyscore;
