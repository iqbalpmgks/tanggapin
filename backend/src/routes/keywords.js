const express = require('express');
const router = express.Router();
const keywordsController = require('../controllers/keywordsController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/keywords
 * @desc    Get user's keywords
 * @access  Private
 */
router.get('/', authenticate, keywordsController.getKeywords);

/**
 * @route   GET /api/keywords/:id
 * @desc    Get single keyword by ID
 * @access  Private
 */
router.get('/:id', authenticate, keywordsController.getKeyword);

/**
 * @route   POST /api/keywords
 * @desc    Create new keyword
 * @access  Private
 */
router.post('/', authenticate, keywordsController.createKeyword);

/**
 * @route   PUT /api/keywords/:id
 * @desc    Update keyword
 * @access  Private
 */
router.put('/:id', authenticate, keywordsController.updateKeyword);

/**
 * @route   DELETE /api/keywords/:id
 * @desc    Delete keyword
 * @access  Private
 */
router.delete('/:id', authenticate, keywordsController.deleteKeyword);

/**
 * @route   GET /api/keywords/post/:postId
 * @desc    Get keywords for specific post
 * @access  Private
 */
router.get('/post/:postId', authenticate, keywordsController.getKeywordsByPost);

/**
 * @route   POST /api/keywords/post/:postId/bulk
 * @desc    Bulk create keywords for post
 * @access  Private
 */
router.post('/post/:postId/bulk', authenticate, keywordsController.bulkCreateKeywords);

/**
 * @route   POST /api/keywords/:id/activate
 * @desc    Activate keyword
 * @access  Private
 */
router.post('/:id/activate', authenticate, keywordsController.activateKeyword);

/**
 * @route   POST /api/keywords/:id/deactivate
 * @desc    Deactivate keyword
 * @access  Private
 */
router.post('/:id/deactivate', authenticate, keywordsController.deactivateKeyword);

/**
 * @route   GET /api/keywords/:id/statistics
 * @desc    Get keyword statistics
 * @access  Private
 */
router.get('/:id/statistics', authenticate, keywordsController.getKeywordStatistics);

/**
 * @route   GET /api/keywords/stats/overview
 * @desc    Get user's keywords overview statistics
 * @access  Private
 */
router.get('/stats/overview', authenticate, keywordsController.getKeywordsOverview);

/**
 * @route   GET /api/keywords/stats/top-performing
 * @desc    Get top performing keywords
 * @access  Private
 */
router.get('/stats/top-performing', authenticate, keywordsController.getTopPerformingKeywords);

/**
 * @route   POST /api/keywords/test-match
 * @desc    Test keyword matching against text
 * @access  Private
 */
router.post('/test-match', authenticate, keywordsController.testKeywordMatch);

module.exports = router;
