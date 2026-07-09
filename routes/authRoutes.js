// const express = require('express');
// const router = express.Router();
// const {
//   registerUser,
//   loginUser,
//   getUserProfile,
//   updateUserProfile,
//   addToWishlist,
//   removeFromWishlist,
//   getWishlist,
// } = require('../controllers/authController');
// const { protect } = require('../middleware/auth');
// const { registerValidation, loginValidation } = require('../validators/authValidator');

// router.post('/register', registerValidation, registerUser);
// router.post('/login', loginValidation, loginUser);
// router.get('/me', protect, getUserProfile);
// router.get('/profile', protect, getUserProfile);
// router.put('/profile', protect, updateUserProfile);
// router.post('/wishlist', protect, addToWishlist);
// router.delete('/wishlist/:id', protect, removeFromWishlist);
// router.get('/wishlist', protect, getWishlist);

// // module.exports = router;
// export default router;





import express from 'express';
const router = express.Router();

// Controllers ko import kiya (.js extension ke sath)
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from '../controllers/authController.js';

// Middleware ko import kiya (.js extension ke sath)
import { protect } from '../middleware/auth.js';

// Validators ko import kiya (.js extension ke sath)
import { registerValidation, loginValidation } from '../validators/authValidator.js';

// Saare Routes
router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);
router.get('/me', protect, getUserProfile);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/wishlist', protect, addToWishlist);
router.delete('/wishlist/:id', protect, removeFromWishlist);
router.get('/wishlist', protect, getWishlist);

// Final Export
export default router;