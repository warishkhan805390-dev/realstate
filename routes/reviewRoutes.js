const express = require('express');
const router = express.Router();
const {
  createReview,
  getFoodReviews,
  deleteReview,
  updateReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { createReviewValidation, updateReviewValidation } = require('../validators/reviewValidator');

router.get('/food/:foodId', getFoodReviews);
router.post('/', protect, createReviewValidation, createReview);
router.put('/:id', protect, updateReviewValidation, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
