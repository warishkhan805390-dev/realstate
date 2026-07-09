const Order = require('../models/Order');
const FoodItem = require('../models/FoodItem');
const Payment = require('../models/Payment');
const Coupon = require('../models/Coupon');
const { validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { orderItems, shippingAddress, paymentMethod, couponCode } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  let itemsPrice = 0;
  const populatedItems = [];

  for (const item of orderItems) {
    const food = await FoodItem.findById(item.food);
    if (!food) {
      return res.status(404).json({ message: `Food item ${item.food} not found` });
    }
    if (!food.isAvailable) {
      return res.status(400).json({ message: `${food.name} is not available` });
    }

    const price = food.price;
    itemsPrice += price * item.qty;
    populatedItems.push({
      name: food.name,
      qty: item.qty,
      price: price,
      image: food.image?.url || '',
      food: food._id,
    });
  }

  const taxPrice = parseFloat((itemsPrice * 0.08).toFixed(2));
  const deliveryCharge = itemsPrice > 500 ? 0 : 40;
  let totalPrice = itemsPrice + taxPrice + deliveryCharge;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (coupon && coupon.usedCount < coupon.usageLimit && itemsPrice >= coupon.minOrderAmount) {
      if (coupon.discountType === 'percentage') {
        totalPrice -= (totalPrice * coupon.discountValue) / 100;
      } else {
        totalPrice -= coupon.discountValue;
      }
      totalPrice = Math.max(0, totalPrice);

      coupon.usedCount += 1;
      await coupon.save();
    }
  }

  totalPrice = parseFloat(totalPrice.toFixed(2));

  const order = await Order.create({
    user: req.user._id,
    orderItems: populatedItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    deliveryCharge,
    totalPrice,
  });

  const createdOrder = await Order.findById(order._id)
    .populate('user', 'name email')
    .populate('orderItems.food', 'name price image');

  res.status(201).json(createdOrder);
};

const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('orderItems.food', 'name price image');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'staff') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  res.json(order);
};

const getUserOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await Order.countDocuments({ user: req.user._id });
  const orders = await Order.find({ user: req.user._id })
    .populate('orderItems.food', 'name price image')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.json({
    orders,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
};

const cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  if (order.orderStatus !== 'Pending') {
    return res.status(400).json({ message: 'Order cannot be cancelled. Only pending orders can be cancelled.' });
  }

  order.orderStatus = 'Cancelled';
  const cancelledOrder = await order.save();

  res.json(cancelledOrder);
};

const processPayment = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const { paymentMethod, paymentId } = req.body;

  if (paymentMethod === 'cod') {
    order.isPaid = false;
    order.paymentMethod = 'cod';
    await order.save();

    await Payment.create({
      order: order._id,
      user: req.user._id,
      paymentMethod: 'cod',
      paymentResult: { status: 'pending', amount: order.totalPrice, currency: 'INR' },
    });

    return res.json({ message: 'Order placed with Cash on Delivery', order });
  }

  if (paymentMethod === 'stripe') {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100),
      currency: 'inr',
      metadata: { orderId: order._id.toString() },
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order._id,
    });
  }

  if (paymentMethod === 'razorpay') {
    const options = {
      amount: Math.round(order.totalPrice * 100),
      currency: 'INR',
      receipt: order._id.toString(),
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return res.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: order._id,
    });
  }

  if (paymentMethod === 'verify') {
    if (paymentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
        if (paymentIntent.status === 'succeeded') {
          order.isPaid = true;
          order.paidAt = Date.now();
          order.paymentResult = {
            id: paymentIntent.id,
            status: paymentIntent.status,
            update_time: new Date().toISOString(),
            email_address: paymentIntent.receipt_email || '',
          };
          order.orderStatus = 'Confirmed';
          await order.save();

          await Payment.create({
            order: order._id,
            user: req.user._id,
            paymentMethod: 'stripe',
            paymentResult: {
              id: paymentIntent.id,
              status: paymentIntent.status,
              amount: order.totalPrice,
              currency: 'INR',
            },
          });

          return res.json({ message: 'Payment verified successfully', order });
        }
      } catch (error) {
        return res.status(400).json({ message: 'Payment verification failed' });
      }
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature === razorpay_signature) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: razorpay_payment_id,
          status: 'completed',
          update_time: new Date().toISOString(),
        };
        order.orderStatus = 'Confirmed';
        await order.save();

        await Payment.create({
          order: order._id,
          user: req.user._id,
          paymentMethod: 'razorpay',
          paymentResult: {
            id: razorpay_payment_id,
            status: 'completed',
            amount: order.totalPrice,
            currency: 'INR',
          },
        });

        return res.json({ message: 'Payment verified successfully', order });
      } else {
        return res.status(400).json({ message: 'Invalid signature' });
      }
    }
  }

  res.status(400).json({ message: 'Invalid payment method' });
};

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  cancelOrder,
  processPayment,
};
