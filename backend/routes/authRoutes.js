const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const buildEmailShell = require('../utils/emailTemplate');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || '';
const smtpPassRaw = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
const smtpPass = String(smtpPassRaw || '').replace(/\s+/g, '');
const smtpService = process.env.SMTP_SERVICE || 'gmail';
const fromEmail = process.env.MAIL_FROM || smtpUser || 'no-reply@sms.local';

const transporter = nodemailer.createTransport({
  service: smtpService,
  auth: {
    user: smtpUser,
    pass: smtpPass
  }
});

function sanitizeRole(inputRole = 'user') {
  const role = String(inputRole || 'user').trim().toLowerCase();
  return role === 'provider' ? 'provider' : 'user';
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function otpExpiryDate(minutes = 15) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

async function sendVerificationEmail(targetEmail, otp) {
  if (!smtpUser || !smtpPass) {
    throw new Error('Email service is not configured');
  }

  await transporter.sendMail({
    from: `"SMS Support" <${fromEmail}>`,
    to: targetEmail,
    subject: 'Verify your account',
    html: buildEmailShell({
      title: 'Verify Your Account',
      subtitle: 'Use this OTP to activate your SMS profile',
      bodyHtml: `
        <p style="margin:0 0 14px;color:#cbd5e1;">Enter this one-time password to complete your registration.</p>
        <div style="display:inline-block;padding:12px 18px;border-radius:12px;background:#111827;border:1px solid #334155;color:#22c55e;font-size:28px;font-weight:700;letter-spacing:6px;">
          ${otp}
        </div>
        <p style="margin:14px 0 0;color:#94a3b8;font-size:13px;">OTP is valid for 15 minutes.</p>
      `
    })
  });
}

router.post('/register', async (req, res) => {
  const { name, email, password, role, address, city, providerService } = req.body;

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedCity = String(city || '').trim();
  const safeRole = sanitizeRole(role);

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ message: 'Name is required' });
  }
  if (!normalizedEmail) {
    return res.status(400).json({ message: 'Email is required' });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  if (!normalizedCity) {
    return res.status(400).json({ message: 'City is required' });
  }
  if (safeRole === 'provider' && !String(providerService || '').trim()) {
    return res.status(400).json({ message: 'Provider service is required' });
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    if (existingUser.isVerified) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const otp = generateOtp();
    existingUser.verifyOTP = otp;
    existingUser.verifyOTPExpiry = otpExpiryDate(15);
    await existingUser.save();

    try {
      await sendVerificationEmail(normalizedEmail, otp);
    } catch (err) {
      console.error('Email error:', err.message);
      return res.status(500).json({ message: 'Failed to send verification email. Please check email settings and try again.' });
    }

    return res.json({ message: 'OTP re-sent' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const otp = generateOtp();

  const createdUser = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password: hashed,
    role: safeRole,
    city: normalizedCity,
    address: safeRole === 'user' ? String(address || '').trim() : '',
    providerService: safeRole === 'provider' ? String(providerService).trim() : '',
    status: safeRole === 'provider' ? 'pending' : 'approved',
    isVerified: false,
    verifyOTP: otp,
    verifyOTPExpiry: otpExpiryDate(15)
  });

  try {
    await sendVerificationEmail(normalizedEmail, otp);
  } catch (err) {
    console.error('Email error:', err.message);
    await User.findByIdAndDelete(createdUser._id);
    return res.status(500).json({ message: 'Failed to send verification email. Please check email settings and try again.' });
  }

  res.json({ message: 'OTP sent' });
});

router.post('/verify-account', async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedOtp = String(otp || '').trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !user.verifyOTP || String(user.verifyOTP).trim() !== normalizedOtp) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }
  if (!user.verifyOTPExpiry || new Date(user.verifyOTPExpiry).getTime() < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  user.isVerified = true;
  user.verifyOTP = null;
  user.verifyOTPExpiry = null;
  await user.save();

  try {
    if (smtpUser && smtpPass) {
      await transporter.sendMail({
        from: `"SMS Support" <${fromEmail}>`,
        to: user.email,
        subject: 'Welcome to SMS - Account Created',
        html: buildEmailShell({
          title: 'Congratulations, Your Account Is Ready!',
          subtitle: 'Thank you for creating your SMS account',
          bodyHtml: `
            <p style="margin:0 0 14px;color:#cbd5e1;">Hi ${user.name || 'User'}, your account has been verified successfully.</p>
            <div style="background:#111827;border:1px solid #334155;border-radius:14px;padding:16px;">
              <p style="margin:0 0 10px;"><strong style="color:#22c55e;">Account Type:</strong> ${user.role || 'user'}</p>
              <p style="margin:0 0 10px;"><strong style="color:#22c55e;">Email:</strong> ${user.email}</p>
              <p style="margin:0;"><strong style="color:#22c55e;">Status:</strong> Verified</p>
            </div>
          `
        })
      });
    }
  } catch (err) {
    console.error('Welcome email error:', err.message);
  }

  res.json({ message: 'Verified' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  if (!user.isVerified) return res.status(403).json({ message: 'Verify email' });
  if (user.role === 'provider' && user.status === 'pending') {
    return res.status(403).json({ message: 'Your provider account is pending admin approval' });
  }
  if (user.role === 'provider' && user.status === 'rejected') {
    return res.status(403).json({ message: 'Your provider account was rejected by admin' });
  }
  if (!await bcrypt.compare(String(password || ''), user.password)) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });

  res.json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      providerService: user.providerService
    }
  });
});

router.get('/me', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    return res.status(401).json({ message: 'Session invalid' });
  }
  res.json(user);
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (!smtpUser || !smtpPass) {
    return res.status(500).json({ message: 'Email service is not configured' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetOTP = otp;
  user.resetOTPExpiry = Date.now() + 10 * 60 * 1000;
  await user.save();

  try {
    await transporter.sendMail({
      from: `"SMS Support" <${fromEmail}>`,
      to: normalizedEmail,
      subject: 'Password Reset OTP',
      html: buildEmailShell({
        title: 'Password Reset Request',
        subtitle: 'Use this OTP to reset your password',
        bodyHtml: `
          <p style="margin:0 0 14px;color:#cbd5e1;">We received a request to reset your password. Use this OTP:</p>
          <div style="display:inline-block;padding:12px 18px;border-radius:12px;background:#111827;border:1px solid #334155;color:#22c55e;font-size:28px;font-weight:700;letter-spacing:6px;">
            ${otp}
          </div>
        `
      })
    });
  } catch (err) {
    console.error('Email error:', err.message);
    return res.status(500).json({ message: 'Failed to send OTP email. Please verify SMTP settings.' });
  }

  res.json({ message: 'OTP sent to email' });
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail, resetOTP: String(otp || '').trim() });
  if (!user || user.resetOTPExpiry < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }
  res.json({ message: 'OTP verified successfully' });
});

router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const user = await User.findOne({ email: normalizedEmail, resetOTP: String(otp || '').trim() });
  if (!user || user.resetOTPExpiry < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  user.password = await bcrypt.hash(String(newPassword), 10);
  user.resetOTP = null;
  user.resetOTPExpiry = null;
  await user.save();

  res.json({ message: 'Password reset successful' });
});

router.post('/create-admin', verifyToken, requireRole('admin'), async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!name || !normalizedEmail || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  if (await User.findOne({ email: normalizedEmail })) {
    return res.status(400).json({ message: 'Already exists' });
  }

  const hashed = await bcrypt.hash(String(password), 10);
  await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password: hashed,
    role: 'admin',
    status: 'approved',
    isVerified: true
  });

  res.json({ message: 'Admin created' });
});

module.exports = router;
