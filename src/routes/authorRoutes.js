const express = require('express');
const router = express.Router();
const authorArticleController = require('../controllers/authorArticleController');
const { strictLimiter } = require('../middleware/rateLimiter');

// Fetch and save articles for 3 authors
// GET /api/authors/fetch-articles?authors=Author1,Author2,Author3
router.get('/fetch-articles', strictLimiter, authorArticleController.fetchArticlesByAuthors);

module.exports = router;
