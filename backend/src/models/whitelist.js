const mongoose = require('mongoose');

const WhitelistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ioc: { type: String, required: true },
  type: { type: String, required: true }, // 'ip', 'domain', etc.
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Whitelist', WhitelistSchema);
