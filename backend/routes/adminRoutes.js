const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Booking = require('../models/Booking');
const Contact = require('../models/contact');
const AdminActionLog = require('../models/AdminActionLog');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const sendSystemEmail = require('../utils/sendSystemEmail');

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

// Admin dashboard stats
router.get(
  '/stats',
  verifyToken,
  requireRole('admin'),
  async (req, res) => {
    const users = await User.countDocuments({ role: 'user' });
    const providers = await User.countDocuments({ role: 'provider' });
    const bookings = await Booking.countDocuments();
    const pendingProviders = await User.countDocuments({ role: 'provider', status: 'pending' });
    const messages = await Contact.countDocuments();
    const openMessages = await Contact.countDocuments({ status: 'open' });
    const reviews = await Booking.countDocuments({ 'review.rating': { $gte: 1, $lte: 5 } });

    res.json({
      users,
      providers,
      bookings,
      pendingProviders,
      messages,
      openMessages,
      reviews
    });
  }
);

// Get all users
router.get(
  '/users',
  verifyToken,
  requireRole('admin'),
  async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
  }
);

// Delete user with reason email notification
router.delete(
  '/users/:id',
  verifyToken,
  requireRole('admin'),
  async (req, res) => {
    try {
      const reason = String(req.body?.reason || '').trim();
      if (reason.length < 5) {
        return res.status(400).json({ message: 'Deletion reason must be at least 5 characters' });
      }

      const user = await User.findOne({ _id: req.params.id, role: 'user' }).select('name email role');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const safeName = escapeHtml(user.name || 'User');
      const safeReason = escapeHtml(reason).replace(/\n/g, '<br>');

      if (user.email && isValidEmail(user.email)) {
        await sendSystemEmail({
          to: user.email,
          subject: 'SMS Account Removal Notice',
          title: 'Your SMS User Account Has Been Removed',
          subtitle: 'This action was performed by SMS administration',
          bodyHtml: `
            <p style="margin:0 0 14px;color:#cbd5e1;">Hello ${safeName},</p>
            <p style="margin:0 0 14px;color:#cbd5e1;">
              Your account has been removed from SMS by the admin team.
            </p>
            <div style="background:#111827;border:1px solid #334155;border-radius:14px;padding:16px;color:#e2e8f0;">
              <strong style="color:#22c55e;">Reason:</strong><br>
              ${safeReason}
            </div>
          `
        });
      }

      await Booking.deleteMany({ userId: user._id });
      await AdminActionLog.create({
        action: 'user_deleted',
        targetRole: 'user',
        targetUserId: user._id,
        targetName: user.name || '',
        targetEmail: user.email || '',
        targetStatus: 'approved',
        reason,
        performedBy: req.user.id
      });
      await User.findByIdAndDelete(user._id);

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error.message);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  }
);

// Get providers with lightweight rating summary
router.get(
  '/providers',
  verifyToken,
  requireRole('admin'),
  async (req, res) => {
    const providers = await User.find({ role: 'provider' }).select('-password').sort({ createdAt: -1 });
    const providerIds = providers.map(provider => provider._id);

    const ratingRows = await Booking.aggregate([
      {
        $match: {
          providerId: { $in: providerIds },
          'review.rating': { $gte: 1, $lte: 5 }
        }
      },
      {
        $group: {
          _id: '$providerId',
          averageRating: { $avg: '$review.rating' },
          ratingCount: { $sum: 1 }
        }
      }
    ]);

    const ratingsMap = new Map(
      ratingRows.map(row => [
        String(row._id),
        {
          averageRating: Number((row.averageRating || 0).toFixed(1)),
          ratingCount: row.ratingCount || 0
        }
      ])
    );

    const result = providers.map(provider => {
      const rating = ratingsMap.get(String(provider._id)) || {
        averageRating: 0,
        ratingCount: 0
      };

      return {
        ...provider.toObject(),
        averageRating: rating.averageRating,
        ratingCount: rating.ratingCount
      };
    });

    res.json(result);
  }
);

// Approve provider
router.put(
  '/providers/:id/approve',
  verifyToken,
  requireRole('admin'),
  async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, {
      status: 'approved'
    });

    res.json({ message: 'Provider approved' });
  }
);

// Reject provider with reason email notification
router.put(
  '/providers/:id/reject',
  verifyToken,
  requireRole('admin'),
  async (req, res) => {
    try {
      const reason = String(req.body?.reason || '').trim();
      if (reason.length < 5) {
        return res.status(400).json({ message: 'Valid rejection reason is required' });
      }

      const provider = await User.findOne({ _id: req.params.id, role: 'provider' })
        .select('name email status');
      if (!provider) {
        return res.status(404).json({ message: 'Provider not found' });
      }

      const safeName = escapeHtml(provider.name || 'Provider');
      const safeReason = escapeHtml(reason).replace(/\n/g, '<br>');

      if (provider.email && isValidEmail(provider.email)) {
        await sendSystemEmail({
          to: provider.email,
          subject: 'SMS Provider Registration Rejected',
          title: 'Provider Registration Rejected',
          subtitle: 'Your provider registration was reviewed by admin',
          bodyHtml: `
            <p style="margin:0 0 14px;color:#cbd5e1;">Hello ${safeName},</p>
            <p style="margin:0 0 14px;color:#cbd5e1;">
              We reviewed your provider registration request and could not approve it.
            </p>
            <div style="background:#111827;border:1px solid #334155;border-radius:14px;padding:16px;color:#e2e8f0;">
              <strong style="color:#22c55e;">Reason:</strong><br>
              ${safeReason}
            </div>
          `
        });
      }

      provider.status = 'rejected';
      provider.isAvailable = false;
      await provider.save();

      await AdminActionLog.create({
        action: 'provider_rejected',
        targetRole: 'provider',
        targetUserId: provider._id,
        targetName: provider.name || '',
        targetEmail: provider.email || '',
        targetStatus: 'rejected',
        reason,
        performedBy: req.user.id
      });

      res.json({ message: 'Provider rejected successfully', provider });
    } catch (error) {
      console.error('Reject provider error:', error.message);
      res.status(500).json({ message: 'Failed to reject provider' });
    }
  }
);

// Toggle provider availability
router.put(
  '/providers/:id/availability',
  verifyToken,
  requireRole('admin'),
  async (req, res) => {
    const provider = await User.findOne({
      _id: req.params.id,
      role: 'provider'
    });

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    provider.isAvailable = provider.isAvailable !== false ? false : true;
    await provider.save();

    res.json({
      message: `Provider is now ${provider.isAvailable ? 'available' : 'unavailable'}`,
      provider
    });
  }
);

// Delete provider with reason email notification
router.delete(
  '/providers/:id',
  verifyToken,
  requireRole('admin'),
  async (req, res) => {
    try {
      const reason = String(req.body?.reason || '').trim();
      if (reason.length < 5) {
        return res.status(400).json({ message: 'Deletion reason must be at least 5 characters' });
      }

      const provider = await User.findOne({ _id: req.params.id, role: 'provider' })
        .select('name email providerService');
      if (!provider) {
        return res.status(404).json({ message: 'Provider not found' });
      }

      const safeName = escapeHtml(provider.name || 'Provider');
      const safeReason = escapeHtml(reason).replace(/\n/g, '<br>');

      if (provider.email && isValidEmail(provider.email)) {
        await sendSystemEmail({
          to: provider.email,
          subject: 'SMS Provider Account Removal Notice',
          title: 'Your SMS Provider Account Has Been Removed',
          subtitle: 'This action was performed by SMS administration',
          bodyHtml: `
            <p style="margin:0 0 14px;color:#cbd5e1;">Hello ${safeName},</p>
            <p style="margin:0 0 14px;color:#cbd5e1;">
              Your provider account has been removed from SMS by the admin team.
            </p>
            <div style="background:#111827;border:1px solid #334155;border-radius:14px;padding:16px;color:#e2e8f0;">
              <strong style="color:#22c55e;">Reason:</strong><br>
              ${safeReason}
            </div>
          `
        });
      }

      await Booking.deleteMany({ providerId: provider._id });
      await AdminActionLog.create({
        action: 'provider_deleted',
        targetRole: 'provider',
        targetUserId: provider._id,
        targetName: provider.name || '',
        targetEmail: provider.email || '',
        targetStatus: provider.status || '',
        reason,
        performedBy: req.user.id
      });
      await User.findByIdAndDelete(provider._id);

      res.json({ message: 'Provider deleted successfully' });
    } catch (error) {
      console.error('Delete provider error:', error.message);
      res.status(500).json({ message: 'Failed to delete provider' });
    }
  }
);

// View all bookings
router.get(
  '/bookings',
  verifyToken,
  requireRole('admin'),
  async (req, res) => {
    const bookings = await Booking.find();
    res.json(bookings);
  }
);

// Get contact messages
router.get(
  '/messages',
  verifyToken,
  requireRole('admin'),
  async (req, res) => {
    const status = String(req.query.status || '').trim().toLowerCase();
    const query = {};

    if (status === 'open' || status === 'resolved') {
      query.status = status;
    }

    const messages = await Contact.find(query).sort({ createdAt: -1 });
    res.json(messages);
  }
);

// Update message status
router.put(
  '/messages/:id/status',
  verifyToken,
  requireRole('admin'),
  async (req, res) => {
    const status = String(req.body?.status || '').trim().toLowerCase();
    if (status !== 'open' && status !== 'resolved') {
      return res.status(400).json({ message: 'Status must be open or resolved' });
    }

    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(message);
  }
);

// Reply to contact message via email
router.post(
  '/messages/:id/reply',
  verifyToken,
  requireRole('admin'),
  async (req, res) => {
    try {
      const replyText = String(req.body?.reply || '').trim();
      if (replyText.length < 5) {
        return res.status(400).json({ message: 'Reply should be at least 5 characters long' });
      }

      const message = await Contact.findById(req.params.id);
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      if (!message.email) {
        return res.status(400).json({ message: 'Customer email is missing for this message' });
      }

      if (!isValidEmail(message.email)) {
        return res.status(400).json({ message: 'Customer email is invalid' });
      }

      const safeName = escapeHtml(message.name || 'Customer');
      const safeReply = escapeHtml(replyText).replace(/\n/g, '<br>');

      await sendSystemEmail({
        to: message.email,
        subject: 'Response from SMS Support Team',
        title: 'Support Reply from SMS',
        subtitle: 'Your contact request has been reviewed by our admin team',
        bodyHtml: `
          <p style="margin:0 0 14px;color:#cbd5e1;">
            Hello ${safeName},
          </p>
        <p style="margin:0 0 14px;color:#cbd5e1;">
          Thank you for contacting SMS. Please find our response below:
        </p>
        <div style="background:#111827;border:1px solid #334155;border-radius:14px;padding:16px;color:#e2e8f0;">
          ${safeReply}
        </div>
      `
      });

      message.adminReply = replyText;
      message.repliedAt = new Date();
      message.status = 'resolved';
      await message.save();

      res.json({ message: 'Reply sent successfully', contact: message });
    } catch (error) {
      console.error('Admin reply email error:', error.message);
      return res.status(500).json({
        message: 'Failed to send email reply. Check SMTP credentials/network and try again.'
      });
    }
  }
);

// Get provider reviews
router.get(
  '/reviews',
  verifyToken,
  requireRole('admin'),
  async (req, res) => {
    const reviews = await Booking.find({
      'review.rating': { $gte: 1, $lte: 5 }
    })
      .select('serviceName status review createdAt providerId userId')
      .populate('providerId', 'name email providerService')
      .populate('userId', 'name email')
      .sort({ 'review.createdAt': -1, createdAt: -1 });

    res.json(reviews);
  }
);

// Admin action history (deletions/rejections)
router.get(
  '/action-history',
  verifyToken,
  requireRole('admin'),
  async (req, res) => {
    const rows = await AdminActionLog.find({})
      .sort({ createdAt: -1 })
      .populate('performedBy', 'name email role')
      .limit(300);
    res.json(rows);
  }
);

module.exports = router;
