const { body } = require('express-validator');

const createFoodValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Food name is required'),
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .custom((value) => value > 0)
    .withMessage('Price must be positive'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Invalid category ID'),
];

const updateFoodValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Food name cannot be empty'),
  body('price')
    .optional()
    .isNumeric()
    .withMessage('Price must be a number')
    .custom((value) => value > 0)
    .withMessage('Price must be positive'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
];

module.exports = { createFoodValidation, updateFoodValidation };
