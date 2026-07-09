const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getUserOrders,
  cancelOrder,
  processPayment,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { createOrderValidation } = require('../validators/orderValidator');

router.post('/', protect, createOrderValidation, createOrder);
router.get('/', protect, getUserOrders);
router.get('/my-orders', protect, getUserOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);
router.post('/:id/pay', protect, processPayment);

// module.exports = router;
export default router;

