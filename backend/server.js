const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const User = require('./models/User');

require('dotenv').config();

const app = express();

// ---------- MIDDLEWARE ----------
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true,
}));

// Increased limit to 10MB to allow image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(cookieParser());
app.set('trust proxy', 1);

// ---------- API ROUTES ----------
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/contact', require('./routes/contact'));

// JSON fallback for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// ---------- ANGULAR FRONTEND ----------
const frontendPath = path.join(__dirname, '../frontend-angular/dist/frontend-angular/browser');

app.use(express.static(frontendPath));

// Angular SPA fallback
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

async function ensureDefaultAdmin() {
  const hasAdmin = await User.exists({ role: 'admin' });
  if (hasAdmin) return;

  const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@sms.local';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
  const name = process.env.DEFAULT_ADMIN_NAME || 'System Admin';

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    console.warn('[seed] Skipped admin seed because default admin email already exists with a non-admin role.');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'admin',
    status: 'approved',
    isVerified: true,
    city: process.env.DEFAULT_ADMIN_CITY || 'Ahmedabad',
    address: process.env.DEFAULT_ADMIN_ADDRESS || 'System Admin Office',
  });

  console.log(`[seed] Default admin created: ${email}`);
}

// ---------- DATABASE ----------
mongoose.connect('mongodb://127.0.0.1:27017/serviceDB')
  .then(async () => {
    console.log('MongoDB Connected');
    await ensureDefaultAdmin();
  })
  .catch(err => console.error(err));

// ---------- SERVER ----------
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
