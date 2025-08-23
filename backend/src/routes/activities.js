const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const activitiesController = require('../controllers/activitiesController');

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   GET /api/activities
 * @desc    Get activities for authenticated user
 * @access  Private
 * @query   page, limit, status, type, startDate, endDate, postId
 */
router.get('/', activitiesController.getActivities);

/**
 * @route   GET /api/activities/stats
 * @desc    Get activity statistics
 * @access  Private
 * @query   timeframe (day, week, month)
 */
router.get('/stats', activitiesController.getActivityStats);

/**
 * @route   GET /api/activities/export
 * @desc    Export activity data
 * @access  Private
 * @query   format (json, csv), startDate, endDate, status, type
 */
router.get('/export', activitiesController.exportActivities);

/**
 * @route   GET /api/activities/:activityId
 * @desc    Get single activity details
 * @access  Private
 */
router.get('/:activityId', activitiesController.getActivityById);

/**
 * @route   POST /api/activities/test-keyword-matching
 * @desc    Test keyword matching for a message
 * @access  Private
 * @body    { postId, text, options }
 */
router.post('/test-keyword-matching', activitiesController.testKeywordMatching);

/**
 * @route   POST /api/activities/batch-test-keyword-matching
 * @desc    Batch test keyword matching for multiple messages
 * @access  Private
 * @body    { postId, messages, options }
 */
router.post('/batch-test-keyword-matching', activitiesController.batchTestKeywordMatching);

/**
 * @route   GET /api/activities/keyword-stats/:postId
 * @desc    Get keyword matching statistics for a post
 * @access  Private
 * @query   startDate, endDate
 */
router.get('/keyword-stats/:postId', activitiesController.getKeywordMatchingStats);

/**
 * @route   POST /api/activities/refresh-cache/:postId
 * @desc    Refresh keyword cache for a post
 * @access  Private
 */
router.post('/refresh-cache/:postId', activitiesController.refreshKeywordCache);

/**
 * @route   POST /api/activities/clear-cache
 * @desc    Clear all keyword cache
 * @access  Private
 */
router.post('/clear-cache', activitiesController.clearKeywordCache);

/**
 * @route   GET /api/activities/service/metrics
 * @desc    Get service performance metrics
 * @access  Private
 */
router.get('/service/metrics', activitiesController.getServiceMetrics);

module.exports = router;
