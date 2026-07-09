const User = require('../models/User');
const Order = require('../models/Order');
const FoodItem = require('../models/FoodItem');
const generateToken = require('../utils/generateToken');
const { exportToCSV, exportToExcel } = require('../utils/exportReports');

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (user && user.role === 'admin' && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

const getDashboardStats = async (req, res) => {
  const totalUsers = await User.countDocuments({ role: 'customer' });
  const totalOrders = await Order.countDocuments();
  const totalFoodItems = await FoodItem.countDocuments();
  const totalStaff = await User.countDocuments({ role: 'staff' });

  const revenueResult = await Order.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
  ]);

  const revenueByMonth = await Order.aggregate([
    { $match: { isPaid: true } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        total: { $sum: '$totalPrice' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('user', 'name email');

  res.json({
    totalCustomers: totalUsers,
    totalOrders,
    totalFoods: totalFoodItems,
    totalStaff,
    totalRevenue,
    ordersByStatus,
    revenueByMonth,
    recentOrders,
  });
};

const getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const search = req.query.search || '';
  const role = req.query.role || '';

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) {
    query.role = role;
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.json({
    users,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
};

const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').populate('wishlist');
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User deleted successfully' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

const getAllOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const status = req.query.status || '';
  const search = req.query.search || '';

  const query = {};
  if (status) {
    query.orderStatus = status;
  }
  if (search) {
    query._id = search;
  }

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email phone')
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

const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone address')
    .populate('orderItems.food', 'name price image');

  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

const updateOrderStatus = async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  order.orderStatus = status;

  if (status === 'Delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  if (status === 'Cancelled') {
    if (order.orderStatus === 'Delivered') {
      return res.status(400).json({ message: 'Cannot cancel delivered order' });
    }
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

const getSalesReport = async (req, res) => {
  const { startDate, endDate, format } = req.query;

  const query = { isPaid: true };
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  if (format === 'csv') {
    const fields = [
      'Order ID',
      'Customer',
      'Email',
      'Items',
      'Total',
      'Status',
      'Date',
    ];
    const data = orders.map((order) => ({
      'Order ID': order._id.toString(),
      Customer: order.user?.name || 'Guest',
      Email: order.user?.email || '',
      Items: order.orderItems.map((i) => `${i.name} x${i.qty}`).join(', '),
      Total: order.totalPrice,
      Status: order.orderStatus,
      Date: order.createdAt,
    }));

    const csv = exportToCSV(data, fields);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');
    return res.send(csv);
  }

  if (format === 'excel') {
    const columns = [
      { header: 'Order ID', key: 'id', width: 25 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Items', key: 'items', width: 40 },
      { header: 'Total', key: 'total', width: 10 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Date', key: 'date', width: 25 },
    ];

    const data = orders.map((order) => ({
      id: order._id.toString(),
      customer: order.user?.name || 'Guest',
      email: order.user?.email || '',
      items: order.orderItems.map((i) => `${i.name} x${i.qty}`).join(', '),
      total: order.totalPrice,
      status: order.orderStatus,
      date: order.createdAt?.toISOString(),
    }));

    const buffer = await exportToExcel(data, 'Sales Report', columns);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
    return res.send(buffer);
  }

  const totalSales = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  res.json({
    orders,
    totalSales,
    count: orders.length,
  });
};

module.exports = {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  getUserById,
  deleteUser,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getSalesReport,
};
