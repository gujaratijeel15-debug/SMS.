const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  price: Number,
  image: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'active'
  },
  deactivationReason: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
