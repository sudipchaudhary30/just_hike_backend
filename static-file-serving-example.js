// Express static file serving example for /uploads directory
const express = require('express');
const path = require('path');
const app = express();

// Serve /uploads as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ...other routes and middleware...

app.listen(5050, () => {
  console.log('Backend server running on http://localhost:5050');
});
