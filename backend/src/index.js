require('dotenv').config({ path: '../.env' });
const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Use Google & Cloudflare DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const app = express();
const PORT = process.env.PORT || 5555;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
console.log(process.env.MONGODB_URI);
// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/scan', require('./routes/scanRoutes'));
app.use('/api/whitelist', require('./routes/whitelistRoutes'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
