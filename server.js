// // import('express-async-errors');
// // const dotenv = require('dotenv');
// import dotenv from 'dotenv';
// // import express = require('express');
// import express from 'express';
// import cors from 'cors';
// // const cors = require('cors');
// const morgan = require('morgan');
// const connectDB = require('./config/db');

// const dns = require('node:dns');
// // dns.setDefaultResultOrder('ipv4first');



// // import dns from "dns";
// dns.setServers(["8.8.8.8","0.0.0.0"]);




// const { configureCloudinary } = require('./config/cloudinary');

// dotenv.config();

// connectDB();
// configureCloudinary();

// const app = express();

// // app.use(cors({
// //   origin: process.env.CLIENT_URL || 'http://localhost:5173',
// //   credentials: true,
// // }));

// app.use(cors({
//   origin: [
//     process.env.CLIENT_URL, 
//     'http://localhost:5173', 
//     'http://localhost:3000' // Aapka naya frontend port yahan add ho gaya
//   ].filter(Boolean), // Yeh line undefined values ko remove karegi agar env variable na ho
//   credentials: true,
// }));




// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// }

// app.get('/api', (req, res) => {
//   res.json({ message: 'Restaurant Management API is running' });
// });

// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/foods', require('./routes/foodRoutes'));
// app.use('/api/categories', require('./routes/categoryRoutes'));
// app.use('/api/orders', require('./routes/orderRoutes'));
// app.use('/api/payments', require('./routes/paymentRoutes'));
// app.use('/api/reviews', require('./routes/reviewRoutes'));
// app.use('/api/coupons', require('./routes/couponRoutes'));
// app.use('/api/reservations', require('./routes/reservationRoutes'));
// app.use('/api/contact', require('./routes/contactRoutes'));
// app.use('/api/admin', require('./routes/adminRoutes'));
// app.use('/api/staff', require('./routes/staffRoutes'));

// app.use((err, req, res, next) => {
//   const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
//   res.status(statusCode).json({
//     message: err.message,
//     stack: process.env.NODE_ENV === 'production' ? null : err.stack,
//   });
// });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });











// import ('express-async-errors');
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dns from 'node:dns';

// Local Configurations Imports
import connectDB from './config/db.js';
import { configureCloudinary } from './config/cloudinary.js';

// Routes Imports
import authRoutes from './routes/authRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import staffRoutes from './routes/staffRoutes.js';

// DNS Setup
dns.setServers(["8.8.8.8", "0.0.0.0"]);

dotenv.config();

// Connect Database & Cloudinary
connectDB();
configureCloudinary();

const app = express();

// CORS Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL, 
    'http://localhost:5173', 
    'http://localhost:3000'
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Base Route
app.get('/api', (req, res) => {
  res.json({ message: 'Restaurant Management API is running' });
});

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);

// Error Middleware
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