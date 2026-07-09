const Coupon = require('../models/Coupon');
const { validationResult } = require('express-validator');

const getCoupons = async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons);
};

const getCouponById = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return res.status(404).json({ message: 'Coupon not found' });
  }
  res.json(coupon);
};

const createCoupon = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { code, discountType, discountValue, minOrderAmount, isActive, expiresAt, usageLimit } = req.body;

  const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (existingCoupon) {
    return res.status(400).json({ message: 'Coupon code already exists' });
  }

  if (discountType === 'percentage' && discountValue > 100) {
    return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
  }

  const coupon = await Coupon.create({
    code,
    discountType,
    discountValue,
    minOrderAmount,
    isActive,
    expiresAt,
    usageLimit,
  });

  res.status(201).json(coupon);
};

const updateCoupon = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return res.status(404).json({ message: 'Coupon not found' });
  }

  if (req.body.code && req.body.code.toUpperCase() !== coupon.code) {
    const existingCoupon = await Coupon.findOne({
      code: req.body.code.toUpperCase(),
      _id: { $ne: req.params.id },
    });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
  }

  if (req.body.discountType === 'percentage' && req.body.discountValue > 100) {
    return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
  }

  coupon.code = req.body.code ? req.body.code.toUpperCase() : coupon.code;
  coupon.discountType = req.body.discountType || coupon.discountType;
  coupon.discountValue = req.body.discountValue || coupon.discountValue;
  coupon.minOrderAmount = req.body.minOrderAmount !== undefined ? req.body.minOrderAmount : coupon.minOrderAmount;
  coupon.isActive = req.body.isActive !== undefined ? req.body.isActive : coupon.isActive;
  coupon.expiresAt = req.body.expiresAt || coupon.expiresAt;
  coupon.usageLimit = req.body.usageLimit || coupon.usageLimit;

  const updatedCoupon = await coupon.save();
  res.json(updatedCoupon);
};

const deleteCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return res.status(404).json({ message: 'Coupon not found' });
  }

  await Coupon.deleteOne({ _id: req.params.id });
  res.json({ message: 'Coupon deleted successfully' });
};

const validateCoupon = async (req, res) => {
  const { code, orderAmount } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Coupon code is required' });
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) {
    return res.status(404).json({ message: 'Invalid coupon code' });
  }

  if (new Date() > new Date(coupon.expiresAt)) {
    return res.status(400).json({ message: 'Coupon has expired' });
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({ message: 'Coupon usage limit reached' });
  }

  if (orderAmount && orderAmount < coupon.minOrderAmount) {
    return res.status(400).json({
      message: `Minimum order amount of $${coupon.minOrderAmount} required`,
    });
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (orderAmount * coupon.discountValue) / 100;
  } else {
    discountAmount = coupon.discountValue;
  }

  res.json({
    valid: true,
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Math.min(discountAmount, orderAmount || Infinity),
    },
  });
};

module.exports = {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};
