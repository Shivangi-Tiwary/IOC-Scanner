const mongoose = require('mongoose');

const ScanReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  summary: {
    total: { type: Number, default: 0 },
    malicious: { type: Number, default: 0 },
    suspicious: { type: Number, default: 0 },
    clean: { type: Number, default: 0 }
  },
  results: { type: [mongoose.Schema.Types.Mixed], default: [] },
  scannedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ScanReport', ScanReportSchema);
