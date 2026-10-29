const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Service = require('../models/Service');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

function normalizeServiceRow(row = {}) {
  const id = row._id || row.id;
  return {
    _id: id,
    name: row.name || row.serviceName || row.title || 'Untitled Service',
    description: row.description || row.desc || '',
    price: typeof row.price === 'number' ? row.price : (typeof row.amount === 'number' ? row.amount : undefined),
    image: row.image || row.imageUrl || '',
    status: row.status || 'active',
    deactivationReason: row.deactivationReason || '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

// CREATE
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const service = new Service(req.body);
    const result = await service.save();
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json(err);
  }
});

// READ ALL
router.get('/', async (req, res) => {
  try {
    const primaryRows = await Service.find().lean();
    const mergedById = new Map();

    for (const row of primaryRows) {
      const normalized = normalizeServiceRow(row);
      mergedById.set(String(normalized._id), normalized);
    }

    // Backward compatibility: old data may be stored in legacy collection names.
    const legacyCollectionNames = ['service', 'Service'];

    if (mongoose.connection?.db) {
      const existingCollections = await mongoose.connection.db.listCollections().toArray();
      const existingNames = new Set(existingCollections.map(item => item.name));

      for (const collectionName of legacyCollectionNames) {
        if (!existingNames.has(collectionName)) continue;

        const legacyRows = await mongoose.connection.db.collection(collectionName).find({}).toArray();
        for (const row of legacyRows) {
          const normalized = normalizeServiceRow(row);
          const key = String(normalized._id);
          if (!mergedById.has(key)) {
            mergedById.set(key, normalized);
          }
        }
      }
    }

    const services = Array.from(mergedById.values());
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch services' });
  }

});

// READ ONE
router.get('/:id', async (req, res) => {
  const service = await Service.findById(req.params.id);
  res.json(service);
});

// UPDATE
router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const updated = await Service.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

// DELETE
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  res.json({ message: 'Service deleted' });
});


module.exports = router;
