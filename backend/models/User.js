const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'provider', 'user'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // users auto-approved
  },
  address: {
    type: String
  },
isAvailable: {
  type: Boolean,
  default: true
},
providerService: {
  type: String,
  default: ''
},
avatar: { type: String, default: '' },  // Stores Base64 string
  cover: { type: String, default: '' },   // Stores Base64 string
  about: { type: String, default: '' },
  phone: { type: String, default: '' },
  city: { type: String, default: '' },
resetOTP: String,
resetOTPExpiry: Date,

isVerified: { type: Boolean, default: false },
verifyOTP: String,
verifyOTPExpiry: Date,

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
