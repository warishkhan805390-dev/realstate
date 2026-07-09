const express = require('express');
const router = express.Router();
const {
  staffLogin,
  getIncomingOrders,
  updateOrderStatus,
  getKitchenOrders,
} = require('../controllers/staffController');
const { protect } = require('../middleware/auth');
const { staff } = require('../middleware/staff');

router.post('/login', staffLogin);
router.get('/orders', protect, staff, getIncomingOrders);
router.put('/orders/:id/status', protect, staff, updateOrderStatus);
router.get('/kitchen', protect, staff, getKitchenOrders);

module.exports = router;
