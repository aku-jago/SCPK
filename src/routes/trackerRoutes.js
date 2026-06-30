const express = require('express');
const router = express.Router();
const trackerController = require('../controllers/trackerController');
const { authenticate } = require('../middleware/auth');

router.post('/cigarette', authenticate, trackerController.logCigarettes);
router.get('/cigarette', authenticate, trackerController.getHistory);

module.exports = router;
