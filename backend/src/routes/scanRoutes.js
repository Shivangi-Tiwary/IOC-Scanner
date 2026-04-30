const express = require('express');
const router = express.Router();
const { protect } = require('../utils/authMid');
const { scanTextSSE, getScanHistory, getScanReport, diffReports, clearCache } = require('../controllers/scanController');

router.post('/', protect, scanTextSSE);
router.get('/history', protect, getScanHistory);
router.get('/history/:id', protect, getScanReport);
router.get('/diff/:oldId/:newId', protect, diffReports);
router.delete('/cache', protect, clearCache);

module.exports = router;
