const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { generateAppointmentID } = require('./IdGenerator.js');
require('dotenv').config();

const app = express();
// Middleware
app.use(cors());
app.use(express.json()); 

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.log('Error connecting to the database', err);
        return;
    }
    console.log('Connected to the MySQL database');
});
app.get('/', function (req, res) {
  res.send('Hello World');
});


// Search for owners
app.get('/owners', (req, res) => {
    const searchQuery = req.query.search || ''; // Receive search query
    const query = `SELECT OwnerID, FirstName,LastName FROM owner  WHERE CONCAT(FirstName, ' ', LastName) LIKE ?`;
    
    db.query(query, [`%${searchQuery}%`], (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      res.json(results);
    });
});


// Search for pets
app.get('/pets', (req, res) => {
    const ownerId = req.query.OwnerId;
    const query = `SELECT PetID, PetName FROM pets WHERE OwnerID = ?`;
  
    db.query(query, [ownerId], (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      res.json(results);
    });
});
app.put('/appointment/:id', (req, res) => {
  
  const { id } = req.params;
  const { Status } = req.body; // Expecting the status to be passed in the request body
  console.log('Updating appointment with ID:', id);
  if (!Status) {
    return res.status(400).send({ message: 'Status is required' });
  }

  const query = `UPDATE appointment SET Status = ? WHERE AppointmentID = ?`;

  db.query(query, [Status, id], (err, result) => {
    if (err) {
      console.error('Failed to update appointment status:', err);
      return res.status(500).send({ message: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: 'Appointment not found' });
    }

    return res.send({ message: 'Appointment status updated successfully' });
  });
});


app.get('/appointment',(req, res)=>{
  const query = `
  select 
      appointment.AppointmentID,
      appointment.Status ,
      appointment.AppointmentDate ,
      appointment.AppointmentTime,
      pets.PetName,
      CONCAT(owner.FirstName, ' ',owner.LastName) AS FullName,
      appointment.TypeService,
      appointment.Reason
      FROM  appointment
      join pets on appointment.PetID=pets.PetID
      join owner on appointment.OwnerID = owner.OwnerID
      `;
      

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.json(results);
  });
})

app.get('/pethotel',(req, res)=>{
  const query = `
  select 
      petshotel.EntryDate,
      petshotel.ExitDate,
      petshotel.Numday,
      petshotel.AppointmentID,
      pets.PetName,
      petshotel.Status
      FROM  petshotel
      join pets on petshotel.PetID=pets.PetID
      `;
      

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.json(results);
  });
})


app.post('/create-appointment', (req, res) => {
  const { OwnerId, PetId, TypeService, AppointmentDate, AppointmentTime, Reason } = req.body;
  let appointmentStatus = 'Approved';
  
  // Function to format date to 'YYYY-MM-DD'
  const formatDateToMySQL = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  try {
    // Validate and format AppointmentDate
    let formattedDate = null;
    if (AppointmentDate) {
      const date = new Date(AppointmentDate);
      if (!isNaN(date.getTime())) {
        formattedDate = formatDateToMySQL(date); // Format date as 'YYYY-MM-DD'
      } else {
        throw new Error('Invalid date format');
      }
    }

    // Validate and format AppointmentTime
    let formattedTime = null;
    if (AppointmentTime) {
      const timePattern = /^\d{2}:\d{2}:\d{2}$/; // Expect 'HH:MM:SS'
      if (timePattern.test(AppointmentTime)) {
        formattedTime = AppointmentTime; // Already in 'HH:MM:SS' format
      } else {
        throw new Error('Invalid time format');
      }
    }

    const formattedReason = Reason ? Reason : null;

    // Generate appointment ID and insert into the database
    generateAppointmentID(db, TypeService, (err, newAppointmentID) => {
      if (err) {
        console.error('Error generating appointment ID:', err);
        return res.status(500).json({ error: 'Error generating appointment ID' });
      }

      const insertQuery = `
        INSERT INTO appointment (AppointmentID, OwnerID, PetID, TypeService, AppointmentDate, AppointmentTime, Reason, Status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(insertQuery, [newAppointmentID, OwnerId, PetId, TypeService, formattedDate, formattedTime, formattedReason, appointmentStatus], (err, result) => {
        if (err) {
          console.error('Error creating appointment:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ message: 'Appointment created successfully!', AppointmentID: newAppointmentID });
      });
    });

  } catch (error) {
    console.error('Date/Time format error:', error.message);
    return res.status(400).json({ error: 'Invalid date or time format' });
  }
});

// API to update the status of an appointment
app.post('/create-pet-hotel', (req, res) => {
  const { AppointmentID, PetId, EntryDate, ExitDate,NumDay } = req.body;
  const petHotelStatus = '';

  const formatDateForDatabase = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formattedEntryDate = formatDateForDatabase(EntryDate);
  const formattedExitDate = formatDateForDatabase(ExitDate);
  const insertPetHotelQuery = `
    INSERT INTO petshotel (AppointmentID, PetID, EntryDate, ExitDate,NumDay, Status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(insertPetHotelQuery, [AppointmentID, PetId, formattedEntryDate, formattedExitDate ,NumDay, petHotelStatus], (err, result) => {
    if (err) {
      console.error('Error creating pet hotel entry:', err);
      return res.status(500).json({ error: 'Database error in creating pet hotel entry' });
    }

    res.json({
      message: 'Pet Hotel entry created successfully!',
      AppointmentID: AppointmentID
    });
  });
});

app.delete('/deleted/appointment/:appointmentId',(req,res)=>{
  const {appointmentId } = req.params 
  console.log("Deleting appointment with ID:", appointmentId);
  const query = 'DELETE FROM appointment WHERE AppointmentID = ?';
  console.log(`Attempting to delete appointment with ID: ${appointmentId}`);
  db.query(query, [appointmentId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete the appointment' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    return res.status(200).json({ message: 'Appointment deleted successfully' });
  });

})

app.listen(8080, function () {
  console.log('Node app is running on port 8080' );
})
