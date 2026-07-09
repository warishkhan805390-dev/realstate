const express = require('express');
const router = express.Router();
const {
  getFoodItems,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
  getFeaturedFood,
  uploadFoodImage,
} = require('../controllers/foodController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const { upload } = require('../middleware/upload');
const { createFoodValidation, updateFoodValidation } = require('../validators/foodValidator');

router.get('/', getFoodItems);
router.get('/featured', getFeaturedFood);
router.get('/:id', getFoodById);
router.post('/', protect, admin, createFoodValidation, createFood);
router.put('/:id', protect, admin, updateFoodValidation, updateFood);
router.delete('/:id', protect, admin, deleteFood);
router.post('/upload-image', protect, admin, upload.single('image'), uploadFoodImage);

module.exports = router;
