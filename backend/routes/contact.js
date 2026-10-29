const router = require('express').Router();
const Contact = require('../models/contact');

router.post('/', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const message = String(req.body?.message || '').trim();

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' });
    }

    const doc = await Contact.create({
      ...req.body,
      name,
      email,
      message
    });

    res.status(201).json({ message: 'Saved', id: doc._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed' });
  }
});

module.exports = router;
