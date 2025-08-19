const express = require('express');
const router = express.Router();
const activitiesController = require('../controllers/activitiesController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/activities
 * @desc    Get user's activities
 * @access  Private
 */
router.get('/', authenticate, activitiesController.getActivities);

/**
 * @route   GET /api/activities/:id
 * @desc    Get single activity by ID
 * @access  Private
 */
router.get('/:id', authenticate, activitiesController.getActivity);

/**
 * @route   POST /api/activities
 * @desc    Create new activity (for testing/manual entry)
 * @access  Private
 */
router.post('/', authenticate, activitiesController.createActivity);

/**
 * @route   GET /api/activities/post/:postId
 * @desc    Get activities for specific post
 * @access  Private
 */
router.get('/post/:postId', authenticate, activitiesController.getActivitiesByPost);

/**
 * @route   GET /api/activities/stats/overview
 * @desc    Get user's activities overview statistics
 * @access  Private
 */
router.get('/stats/overview', authenticate, activitiesController.getActivitiesOverview);

/**
 * @route   GET /api/activities/stats/hourly
 * @desc    Get hourly activity distribution
 * @access  Private
 */
router.get('/stats/hourly', authenticate, activitiesController.getHourlyDistribution);

/**
 * @route   GET /api/activities/stats/performance
 * @desc    Get performance statistics
 * @access  Private
 */
router.get('/stats/performance', authenticate, activitiesController.getPerformanceStats);

/**
 * @route   POST /api/activities/:id/retry
 * @desc    Retry failed activity
 * @access  Private
 */
router.post('/:id/retry', authenticate, activitiesController.retryActivity);

/**
 * @route   GET /api/activities/failed
 * @desc    Get failed activities that can be retried
 * @access  Private
 */
router.get('/failed', authenticate, activitiesController.getFailedActivities);

/**
 * @route   POST /api/activities/retry-batch
 * @desc    Retry multiple failed activities
 * @access  Private
 */
router.post('/retry-batch', authenticate, activitiesController.retryBatchActivities);

/**
 * @route   GET /api/activities/export
 * @desc    Export activities data
 * @access  Private
 */
router.get('/export', authenticate, activitiesController.exportActivities);

/**
 * @route   DELETE /api/activities/cleanup
 * @desc    Cleanup old activities (Admin only)
 * @access  Private (Admin)
 */
router.delete('/cleanup', authenticate, authorize('admin'), activitiesController.cleanupOldActivities);

module.exports = router;
