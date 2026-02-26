const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const clientRoutes = require('./routes/clientRoutes');
const loanRoutes = require('./routes/loanRoutes');

const app = express();

// Database Connection
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes Placeholder
app.use('/api/clients', clientRoutes);// app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/loans', loanRoutes);

const PORT = process.env.PORT || 4700;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));