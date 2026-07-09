const express = require('express');
const router = express.Router();
const {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} = require('../controllers/couponController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const { body } = require('express-validator');

const couponValidation = [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('discountType')
    .notEmpty()
    .withMessage('Discount type is required')
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be percentage or fixed'),
  body('discountValue')
    .isNumeric()
    .withMessage('Discount value must be a number')
    .custom((v) => v > 0)
    .withMessage('Discount value must be positive'),
  body('expiresAt').isISO8601().withMessage('Valid expiry date is required'),
];

router.get('/', protect, admin, getCoupons);
router.get('/:id', protect, admin, getCouponById);
router.post('/', protect, admin, couponValidation, createCoupon);
router.put('/:id', protect, admin, couponValidation, updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);
router.post('/validate', protect, validateCoupon);

// module.exports = router;
export default router;