const mongoose = require('mongoose');

const ScanSchema = new mongoose.Schema({
  ioc: { type: String, required: true, index: true },
  type: { type: String, required: true }, // 'ip', 'hash', 'domain'
  results: { type: mongoose.Schema.Types.Mixed }, // JSON dump of API results
  scannedAt: { type: Date, default: Date.now }
});

// Cache for 24 hours
ScanSchema.index({ scannedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Scan', ScanSchema);
