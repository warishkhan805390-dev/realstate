// import('express-async-errors');
// const dotenv = require('dotenv');
import dotenv from 'dotenv';
// import express = require('express');
import express from 'express';
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const dns = require('node:dns');
// dns.setDefaultResultOrder('ipv4first');



// import dns from "dns";
dns.setServers(["8.8.8.8","0.0.0.0"]);




const { configureCloudinary } = require('./config/cloudinary');

dotenv.config();

connectDB();
configureCloudinary();

const app = express();

// app.use(cors({
//   origin: process.env.CLIENT_URL || 'http://localhost:5173',
//   credentials: true,
// }));

app.use(cors({
  origin: [
    process.env.CLIENT_URL, 
    'http://localhost:5173', 
    'http://localhost:3000' // Aapka naya frontend port yahan add ho gaya
  ].filter(Boolean), // Yeh line undefined values ko remove karegi agar env variable na ho
  credentials: true,
}));




app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get('/api', (req, res) => {
  res.json({ message: 'Restaurant Management API is running' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/foods', require('./routes/foodRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
