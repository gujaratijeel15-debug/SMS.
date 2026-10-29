const mongoose = require('mongoose');

const adminActionLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['provider_rejected', 'provider_deleted', 'user_deleted'],
    required: true
  },
  targetRole: {
    type: String,
    enum: ['provider', 'user'],
    required: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  targetName: {
    type: String,
    default: ''
  },
  targetEmail: {
    type: String,
    default: ''
  },
  targetStatus: {
    type: String,
    default: ''
  },
  reason: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('AdminActionLog', adminActionLogSchema);
