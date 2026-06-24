const express = require('express');
const router = express.Router();
const screeningController = require('../controllers/screeningController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { screeningValidation } = require('../utils/validators');

// All screening routes require authentication
router.use(authenticate);

router.post('/', screeningValidation, validate, screeningController.create);
router.get('/history', screeningController.getHistory);
router.get('/:id', screeningController.getById);
router.get('/:id/result', screeningController.getResult);

module.exports = router;
