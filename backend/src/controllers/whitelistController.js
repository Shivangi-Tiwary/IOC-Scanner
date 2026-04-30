const Whitelist = require('../models/whitelist');

const getWhitelist = async (req, res) => {
  try {
    const items = await Whitelist.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addWhitelist = async (req, res) => {
  try {
    const { ioc, type, notes } = req.body;
    if (!ioc || !type) return res.status(400).json({ error: 'IOC and type required' });
    const exists = await Whitelist.findOne({ user: req.user._id, ioc });
    if (exists) return res.status(400).json({ error: 'Already whitelisted' });
    const item = await Whitelist.create({ user: req.user._id, ioc, type, notes });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeWhitelist = async (req, res) => {
  try {
    await Whitelist.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getWhitelist, addWhitelist, removeWhitelist };
