const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'stripe', 'razorpay'],
      required: true,
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      amount: { type: Number },
      currency: { type: String, default: 'INR' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
