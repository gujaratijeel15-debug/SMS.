const express = require('express');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();



// 👤 Get logged in user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userObj = user.toObject();
    if (userObj.role === 'provider') {
      const [ratingStats] = await Booking.aggregate([
        {
          $match: {
            providerId: user._id,
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

      userObj.averageRating = Number((ratingStats?.averageRating || 0).toFixed(1));
      userObj.ratingCount = ratingStats?.ratingCount || 0;
    }

    res.json(userObj);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// ✏️ Update profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const role = req.user.role;
    const baseAllowedFields = ['name', 'phone', 'avatar', 'cover', 'about'];
    const roleAllowedFields = role === 'provider'
      ? [...baseAllowedFields, 'providerService']
      : role === 'user'
        ? [...baseAllowedFields, 'address', 'city']
        : baseAllowedFields;

    const updates = {};
    for (const field of roleAllowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    // Enforce single service selection for provider accounts
    if (role === 'provider') {
      if (!updates.providerService || !String(updates.providerService).trim()) {
        return res.status(400).json({ message: "Provider service is required" });
      }
      updates.providerService = String(updates.providerService).trim();
    }

    if (role === 'user') {
      if ('name' in updates) updates.name = String(updates.name || '').trim();
      if ('phone' in updates) updates.phone = String(updates.phone || '').trim();
      if ('about' in updates) updates.about = String(updates.about || '').trim();
      if ('city' in updates) updates.city = String(updates.city || '').trim();
      if ('address' in updates) updates.address = String(updates.address || '').trim();
    }

    if (role === 'provider') {
      if ('name' in updates) updates.name = String(updates.name || '').trim();
      if ('phone' in updates) updates.phone = String(updates.phone || '').trim();
      if ('about' in updates) updates.about = String(updates.about || '').trim();
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    ).select('-password');

    res.json(updated);

  } catch (err) {
    res.status(500).json({ message: "Failed to update profile" });
  }
});

module.exports = router;
