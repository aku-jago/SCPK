const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// All admin routes require authentication + ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Analytics
router.get('/analytics', adminController.getAnalytics);

// Users
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Fuzzy Rules
router.get('/fuzzy-rules', adminController.getFuzzyRules);
router.post('/fuzzy-rules', adminController.createFuzzyRule);
router.put('/fuzzy-rules/:id', adminController.updateFuzzyRule);
router.delete('/fuzzy-rules/:id', adminController.deleteFuzzyRule);

// Fuzzy Variables
router.get('/fuzzy-variables', adminController.getFuzzyVariables);

// Risk Distribution
router.get('/risk-distribution', adminController.getRiskDistribution);

module.exports = router;
