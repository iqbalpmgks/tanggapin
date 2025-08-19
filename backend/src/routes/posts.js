const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/posts
 * @desc    Get user's posts
 * @access  Private
 */
router.get('/', authenticate, postsController.getPosts);

/**
 * @route   GET /api/posts/:id
 * @desc    Get single post by ID
 * @access  Private
 */
router.get('/:id', authenticate, postsController.getPost);

/**
 * @route   POST /api/posts
 * @desc    Create new post
 * @access  Private
 */
router.post('/', authenticate, postsController.createPost);

/**
 * @route   PUT /api/posts/:id
 * @desc    Update post
 * @access  Private
 */
router.put('/:id', authenticate, postsController.updatePost);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete post
 * @access  Private
 */
router.delete('/:id', authenticate, postsController.deletePost);

/**
 * @route   POST /api/posts/:id/automation/enable
 * @desc    Enable automation for post
 * @access  Private
 */
router.post('/:id/automation/enable', authenticate, postsController.enableAutomation);

/**
 * @route   POST /api/posts/:id/automation/disable
 * @desc    Disable automation for post
 * @access  Private
 */
router.post('/:id/automation/disable', authenticate, postsController.disableAutomation);

/**
 * @route   GET /api/posts/:id/statistics
 * @desc    Get post statistics
 * @access  Private
 */
router.get('/:id/statistics', authenticate, postsController.getPostStatistics);

/**
 * @route   POST /api/posts/sync
 * @desc    Sync posts from Instagram
 * @access  Private
 */
router.post('/sync', authenticate, postsController.syncPosts);

/**
 * @route   GET /api/posts/stats/overview
 * @desc    Get user's posts overview statistics
 * @access  Private
 */
router.get('/stats/overview', authenticate, postsController.getPostsOverview);

module.exports = router;
