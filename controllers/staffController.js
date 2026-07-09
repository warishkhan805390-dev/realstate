const User = require('../models/User');
const Order = require('../models/Order');
const generateToken = require('../utils/generateToken');

const staffLogin = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (user && (user.role === 'staff' || user.role === 'admin') && (await user.matchPassword(password))) {
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

const getIncomingOrders = async (req, res) => {
  const statuses = ['Pending', 'Confirmed', 'Preparing'];
  const orders = await Order.find({ orderStatus: { $in: statuses } })
    .populate('user', 'name email phone')
    .populate('orderItems.food', 'name price image')
    .sort({ createdAt: -1 });

  res.json(orders);
};

const updateOrderStatus = async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['Preparing', 'Ready'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Staff can only set status to Preparing or Ready' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.orderStatus === 'Cancelled' || order.orderStatus === 'Delivered') {
    return res.status(400).json({ message: `Cannot update order in ${order.orderStatus} status` });
  }

  order.orderStatus = status;

  if (status === 'Ready') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

const getKitchenOrders = async (req, res) => {
  const orders = await Order.find({
    orderStatus: { $in: ['Confirmed', 'Preparing'] },
  })
    .populate('user', 'name')
    .populate('orderItems.food', 'name')
    .sort({ createdAt: 1 });

  res.json(orders);
};

module.exports = {
  staffLogin,
  getIncomingOrders,
  updateOrderStatus,
  getKitchenOrders,
};
