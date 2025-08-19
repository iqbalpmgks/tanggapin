const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

/**
 * @route   GET /api/webhook/instagram
 * @desc    Instagram webhook verification
 * @access  Public
 */
router.get('/instagram', webhookController.verifyWebhook);

/**
 * @route   POST /api/webhook/instagram
 * @desc    Instagram webhook events
 * @access  Public
 */
router.post('/instagram', webhookController.handleWebhook);

/**
 * @route   GET /api/webhook/status
 * @desc    Get webhook status and configuration
 * @access  Private (Admin)
 */
router.get('/status', webhookController.getWebhookStatus);

/**
 * @route   POST /api/webhook/test
 * @desc    Test webhook processing with mock data
 * @access  Private (Admin)
 */
router.post('/test', webhookController.testWebhook);

module.exports = router;
