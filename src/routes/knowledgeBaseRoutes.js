const express = require('express');
const router = express.Router();
const knowledgeBaseController = require('../controllers/knowledgeBaseController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Public: view published articles
router.get('/', knowledgeBaseController.getAll);
router.get('/:id', knowledgeBaseController.getById);

// Admin only: create, update, delete
router.post('/', authenticate, authorize('ADMIN'), knowledgeBaseController.create);
router.put('/:id', authenticate, authorize('ADMIN'), knowledgeBaseController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), knowledgeBaseController.delete);

module.exports = router;
