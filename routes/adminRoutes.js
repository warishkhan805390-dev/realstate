const express = require('express');
const router = express.Router();
const {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  getUserById,
  deleteUser,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getSalesReport,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

router.post('/login', adminLogin);
router.get('/stats', protect, admin, getDashboardStats);
router.get('/users', protect, admin, getAllUsers);
router.get('/users/:id', protect, admin, getUserById);
router.delete('/users/:id', protect, admin, deleteUser);
router.get('/orders', protect, admin, getAllOrders);
router.get('/orders/:id', protect, admin, getOrderById);
router.put('/orders/:id/status', protect, admin, updateOrderStatus);
router.get('/sales', protect, admin, getSalesReport);
router.get('/sales/export', protect, admin, getSalesReport);


export default router;
