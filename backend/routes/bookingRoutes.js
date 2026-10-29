const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const sendReceiptEmail = require('../utils/sendReceipt');
const sendSystemEmail = require('../utils/sendSystemEmail');
const razorpay = require('../config/razorpay');

const router = express.Router();

function getServiceNameFromPrice(price) {
  const serviceMap = {
    500: 'Home Cleaning',
    700: 'Plumbing',
    600: 'Electrical',
    900: 'Appliance Repair'
  };
  return serviceMap[price] || 'Service';
}

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildServiceRegex(serviceName = '') {
  const normalized = String(serviceName).trim().replace(/\s+/g, ' ');
  const escaped = escapeRegex(normalized).replace(/\\ /g, '\\s+');
  return new RegExp(`^\\s*${escaped}\\s*$`, 'i');
}

function normalizeCity(city = '') {
  return String(city)
    .toLowerCase()
    .split(',')[0]
    .replace(/[^a-z0-9\\s]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

async function getProviderRatingsMap(providerIds = []) {
  if (!providerIds.length) return new Map();

  const stats = await Booking.aggregate([
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

  return new Map(
    stats.map(item => [
      String(item._id),
      {
        averageRating: Number((item.averageRating || 0).toFixed(1)),
        ratingCount: item.ratingCount || 0
      }
    ])
  );
}

async function findProviderByService(serviceName, userCity, selectedProviderId = null) {
  if (!serviceName || !userCity) return null;
  const normalizedUserCity = normalizeCity(userCity);
  if (!normalizedUserCity) return null;

  const query = {
    role: 'provider',
    providerService: buildServiceRegex(serviceName)
  };
  if (selectedProviderId) query._id = selectedProviderId;

  const providers = await User.find(query).select('_id city isAvailable');
  return providers.find(
    p => normalizeCity(p.city) === normalizedUserCity && p.isAvailable !== false
  ) || null;
}

router.get('/providers/by-service/:serviceName', verifyToken, requireRole('user'), async (req, res) => {
  try {
    const serviceName = decodeURIComponent(req.params.serviceName || '').trim();
    if (!serviceName) {
      return res.status(400).json({ message: 'Service is required' });
    }

    const user = await User.findById(req.user.id).select('city');
    const userCity = String(user?.city || '').trim();
    if (!userCity) {
      return res.status(400).json({ message: 'Please update your city in profile first' });
    }
    const normalizedUserCity = normalizeCity(userCity);

    const providers = await User.find({
      role: 'provider',
      providerService: buildServiceRegex(serviceName)
    }).select('name email avatar providerService city status isAvailable');

    const cityMatchedProviders = providers.filter(
      provider => normalizeCity(provider.city) === normalizedUserCity
    );

    if (!cityMatchedProviders.length) {
      return res.json({ providers: [], message: 'Provider not available in your area!' });
    }

    const activeProviders = cityMatchedProviders.filter(provider => provider.isAvailable !== false);
    if (!activeProviders.length) {
      return res.json({ providers: [], message: 'Providers exist in your area but are currently unavailable.' });
    }

    const ratingsMap = await getProviderRatingsMap(activeProviders.map(provider => provider._id));
    const providersWithRatings = activeProviders.map(provider => {
      const rating = ratingsMap.get(String(provider._id)) || { averageRating: 0, ratingCount: 0 };
      return {
        ...provider.toObject(),
        averageRating: rating.averageRating,
        ratingCount: rating.ratingCount
      };
    });

    res.json({ providers: providersWithRatings, message: '' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, requireRole('user'), async (req, res) => {
  try {
    const { serviceId, providerId } = req.body;

    if (!serviceId || !mongoose.isValidObjectId(serviceId)) {
      return res.status(400).json({ message: 'Valid serviceId is required' });
    }

    const service = await Service.findById(serviceId).select('name price');
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const serviceName = String(service.name || '').trim();
    const numericPrice = Number(service.price);
    if (!serviceName || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ message: 'Selected service is invalid' });
    }

    const user = await User.findById(req.user.id);
    const userCity = String(user?.city || '').trim();
    if (!userCity) {
      return res.status(400).json({ message: 'Please update your city in profile first' });
    }

    if (providerId) {
      if (!mongoose.isValidObjectId(providerId)) {
        return res.status(400).json({ message: 'Invalid providerId' });
      }

      const selectedProvider = await User.findById(providerId).select('providerService city isAvailable role');
      if (!selectedProvider || selectedProvider.role !== 'provider') {
        return res.status(404).json({ message: 'Selected provider not found' });
      }
      if (normalizeCity(selectedProvider.city) !== normalizeCity(userCity)) {
        return res.status(404).json({ message: 'Provider not available in your area!' });
      }
      if (!buildServiceRegex(serviceName).test(String(selectedProvider.providerService || ''))) {
        return res.status(400).json({ message: 'Selected provider does not offer this service' });
      }
      if (selectedProvider.isAvailable === false) {
        return res.status(400).json({ message: 'Selected provider is currently unavailable' });
      }
    }

    const provider = await findProviderByService(serviceName, userCity, providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not available in your area!' });
    }

    const booking = await Booking.create({
      userId: user._id,
      providerId: provider._id,
      serviceName,
      serviceId: service._id,
      price: numericPrice,
      address: user.address,
      status: 'pending'
    });

    res.status(201).json({ message: 'Booking created', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/provider', verifyToken, requireRole('provider'), async (req, res) => {
  try {
    let bookings = await Booking.find({ providerId: req.user.id }).populate('userId').populate('serviceId');
    bookings = bookings.map(booking => {
      if (!booking.serviceName) booking.serviceName = getServiceNameFromPrice(booking.price);
      return booking;
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/provider/pending', verifyToken, requireRole('provider'), async (req, res) => {
  let bookings = await Booking.find({ providerId: req.user.id, status: 'pending' })
    .populate('userId')
    .populate('serviceId');
  bookings = bookings.map(booking => {
    if (!booking.serviceName) booking.serviceName = getServiceNameFromPrice(booking.price);
    return booking;
  });
  res.json(bookings);
});

router.put('/:id/accept', verifyToken, requireRole('provider'), async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, providerId: req.user.id, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Booking accepted', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/reject', verifyToken, requireRole('provider'), async (req, res) => {
  try {
    const reason = String(req.body?.reason || '').trim();
    if (reason.length < 5) {
      return res.status(400).json({ message: 'Valid rejection reason is required' });
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, providerId: req.user.id, status: 'pending' },
      { status: 'rejected', rejectionReason: reason },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Booking rejected', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/my', verifyToken, requireRole('user'), async (req, res) => {
  try {
    let bookings = await Booking.find({ userId: req.user.id }).populate('providerId').populate('serviceId');
    bookings = bookings.map(booking => {
      if (!booking.serviceName) booking.serviceName = getServiceNameFromPrice(booking.price);
      return booking;
    });

    const providerIds = bookings.map(booking => booking?.providerId?._id).filter(Boolean);
    const ratingsMap = await getProviderRatingsMap(providerIds);

    bookings = bookings.map(booking => {
      if (!booking?.providerId?._id) return booking;
      const providerKey = String(booking.providerId._id);
      const rating = ratingsMap.get(providerKey) || { averageRating: 0, ratingCount: 0 };
      booking.providerId = {
        ...(booking.providerId.toObject ? booking.providerId.toObject() : booking.providerId),
        averageRating: rating.averageRating,
        ratingCount: rating.ratingCount
      };
      return booking;
    });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/review', verifyToken, requireRole('user'), async (req, res) => {
  try {
    const rating = Number(req.body?.rating);
    const responseText = String(req.body?.response || '').trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    if (responseText.length < 3) {
      return res.status(400).json({ message: 'Please write a valid review response' });
    }

    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Review allowed only for completed bookings' });
    }
    if (booking.review?.rating) {
      return res.status(400).json({ message: 'Review already submitted' });
    }

    booking.review = { rating, response: responseText, createdAt: new Date() };
    await booking.save();

    if (rating <= 2 && booking.providerId) {
      const provider = await User.findById(booking.providerId).select('name email status');
      const ratingText = rating === 1 ? '1 star' : '2 stars';
      if (provider?.email && provider.status === 'approved') {
        await sendSystemEmail({
          to: provider.email,
          subject: 'Important Performance Notice - SMS',
          title: 'Performance Warning for Provider Account',
          subtitle: `A customer has rated your recent service with ${ratingText}`,
          bodyHtml: `
            <p style="margin:0 0 14px;color:#cbd5e1;">Hi ${provider.name || 'Provider'},</p>
            <p style="margin:0 0 14px;color:#cbd5e1;">
              You just got a <strong style="color:#22c55e;">${ratingText} rating</strong> from a customer.
            </p>
            <div style="background:#111827;border:1px solid #334155;border-radius:14px;padding:16px;color:#e2e8f0;">
              Please improve your service quality to maintain your provider account on SMS.
            </div>
          `
        });
      }
    }

    res.json({ message: 'Review submitted successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/provider/active', verifyToken, requireRole('provider'), async (req, res) => {
  try {
    let bookings = await Booking.find({ providerId: req.user.id, status: 'accepted' })
      .populate('userId')
      .populate('serviceId');
    bookings = bookings.map(booking => {
      if (!booking.serviceName) booking.serviceName = getServiceNameFromPrice(booking.price);
      return booking;
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/provider/availability', verifyToken, requireRole('provider'), async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user.isAvailable === undefined) {
    user.isAvailable = true;
    await user.save();
  }
  res.json({ isAvailable: user.isAvailable !== false });
});

router.put('/provider/availability', verifyToken, requireRole('provider'), async (req, res) => {
  const user = await User.findById(req.user.id);
  user.isAvailable = !user.isAvailable;
  await user.save();
  res.json({ isAvailable: user.isAvailable });
});

router.delete('/:id', verifyToken, requireRole('user'), async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, status: 'pending' },
      { status: 'cancelled' },
      { new: true }
    );
    if (!booking) {
      return res.status(400).json({ message: 'Only pending bookings can be cancelled' });
    }
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/cash-payment', verifyToken, requireRole('user'), async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!(booking.status === 'accepted' || booking.status === 'completed')) {
      return res.status(400).json({ message: 'Cash payment is allowed only for accepted/completed bookings' });
    }
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Booking is already paid' });
    }

    booking.paymentMethod = 'cash';
    booking.paymentStatus = 'unpaid';
    await booking.save();
    res.json({ message: 'Cash payment selected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/create-order', verifyToken, requireRole('user'), async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'accepted') {
      return res.status(400).json({ message: 'Payment allowed only for accepted bookings' });
    }
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Booking is already paid' });
    }

    const order = await razorpay.orders.create({
      amount: booking.price * 100,
      currency: 'INR',
      receipt: `receipt_${booking._id}`
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/verify-payment', verifyToken, requireRole('user'), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing Razorpay payment fields' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment' });
    }

    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!(booking.status === 'accepted' || booking.status === 'completed')) {
      return res.status(400).json({ message: 'Invalid booking status for payment' });
    }
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Booking is already paid' });
    }

    booking.paymentMethod = 'online';
    booking.paymentStatus = 'paid';
    booking.paymentId = razorpay_payment_id;
    booking.paidAt = new Date();
    await booking.save();

    const user = await User.findById(booking.userId);
    if (user?.email) {
      await sendReceiptEmail(user.email, booking);
    }

    res.json({ message: 'Payment successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/mark-paid', verifyToken, requireRole('provider'), async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, providerId: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.paymentMethod !== 'cash') {
      return res.status(400).json({ message: 'Only cash payments can be marked manually' });
    }
    if (booking.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted jobs can be marked paid' });
    }
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Payment already marked as paid' });
    }

    booking.paymentStatus = 'paid';
    booking.paidAt = new Date();
    await booking.save();

    const user = await User.findById(booking.userId);
    if (user?.email) {
      await sendReceiptEmail(user.email, booking);
    }

    res.json({ message: 'Payment marked as received', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/complete', verifyToken, requireRole('provider'), async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, providerId: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted jobs can be completed' });
    }
    if (!booking.paymentMethod) {
      return res.status(400).json({ message: 'Payment method not selected' });
    }
    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Payment must be received before completing job' });
    }

    booking.status = 'completed';
    await booking.save();
    res.json({ message: 'Job completed successfully', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/provider/history', verifyToken, requireRole('provider'), async (req, res) => {
  try {
    let bookings = await Booking.find({
      providerId: req.user.id,
      status: { $in: ['completed', 'rejected', 'cancelled'] }
    }).populate('userId').populate('serviceId');

    bookings = bookings.map(booking => {
      if (!booking.serviceName) booking.serviceName = getServiceNameFromPrice(booking.price);
      return booking;
    });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/provider/stats', verifyToken, requireRole('provider'), async (req, res) => {
  try {
    const providerId = req.user.id;
    const totalRequests = await Booking.countDocuments({ providerId });
    const activeJobs = await Booking.countDocuments({ providerId, status: 'accepted' });
    const completedJobs = await Booking.countDocuments({ providerId, status: 'completed' });
    const rejectedJobs = await Booking.countDocuments({
      providerId,
      status: { $in: ['rejected', 'cancelled'] }
    });

    res.json({ totalRequests, activeJobs, completedJobs, rejectedJobs });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/provider/notifications', verifyToken, requireRole('provider'), async (req, res) => {
  try {
    const count = await Booking.countDocuments({ providerId: req.user.id, status: 'pending' });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/provider/earnings', verifyToken, requireRole('provider'), async (req, res) => {
  try {
    const completedJobs = await Booking.find({
      providerId: req.user.id,
      status: 'completed'
    }).populate('userId', 'name');

    const totalEarnings = completedJobs.reduce((sum, job) => sum + (job.price || 0), 0);
    res.json({ totalEarnings, jobs: completedJobs });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
