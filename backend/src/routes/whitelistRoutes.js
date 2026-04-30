const express = require('express');
const router = express.Router();
const { protect } = require('../utils/authMid');
const { getWhitelist, addWhitelist, removeWhitelist } = require('../controllers/whitelistController');

router.get('/', protect, getWhitelist);
router.post('/', protect, addWhitelist);
router.delete('/:id', protect, removeWhitelist);

module.exports = router;
