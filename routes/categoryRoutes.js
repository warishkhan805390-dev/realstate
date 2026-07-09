const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const { body } = require('express-validator');

const categoryValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
];

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', protect, admin, categoryValidation, createCategory);
router.put('/:id', protect, admin, categoryValidation, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

// module.exports = router;
export default router;