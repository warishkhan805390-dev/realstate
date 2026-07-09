const { body } = require('express-validator');

const createReviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isString()
    .withMessage('Comment must be a string'),
  body('foodItem')
    .notEmpty()
    .withMessage('Food item ID is required')
    .isMongoId()
    .withMessage('Invalid food item ID'),
];

const updateReviewValidation = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isString()
    .withMessage('Comment must be a string'),
];

module.exports = { createReviewValidation, updateReviewValidation };
