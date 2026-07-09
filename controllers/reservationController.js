const Reservation = require('../models/Reservation');
const { validationResult } = require('express-validator');

const createReservation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, date, time, guests, tableNumber, specialRequests } = req.body;

  const reservationDate = new Date(date);
  if (reservationDate < new Date().setHours(0, 0, 0, 0)) {
    return res.status(400).json({ message: 'Reservation date cannot be in the past' });
  }

  const existingReservation = await Reservation.findOne({
    tableNumber,
    date: reservationDate,
    time,
    status: { $in: ['Pending', 'Confirmed'] },
  });

  if (existingReservation && tableNumber) {
    return res.status(400).json({ message: 'Table is already booked for this time' });
  }

  const reservation = await Reservation.create({
    user: req.user?._id,
    name,
    email,
    phone,
    date: reservationDate,
    time,
    guests,
    tableNumber,
    specialRequests,
  });

  res.status(201).json(reservation);
};

const getUserReservations = async (req, res) => {
  const reservations = await Reservation.find({ user: req.user._id }).sort({ date: -1 });
  res.json(reservations);
};

const getAllReservations = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.date) {
    const searchDate = new Date(req.query.date);
    query.date = {
      $gte: searchDate,
      $lte: new Date(searchDate.setHours(23, 59, 59, 999)),
    };
  }

  const total = await Reservation.countDocuments(query);
  const reservations = await Reservation.find(query)
    .populate('user', 'name email phone')
    .skip(skip)
    .limit(limit)
    .sort({ date: -1, time: -1 });

  res.json({
    reservations,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
};

const updateReservationStatus = async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    return res.status(404).json({ message: 'Reservation not found' });
  }

  reservation.status = status;
  const updatedReservation = await reservation.save();

  res.json(updatedReservation);
};

const deleteReservation = async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    return res.status(404).json({ message: 'Reservation not found' });
  }

  await Reservation.deleteOne({ _id: req.params.id });
  res.json({ message: 'Reservation deleted successfully' });
};

module.exports = {
  createReservation,
  getUserReservations,
  getAllReservations,
  updateReservationStatus,
  deleteReservation,
};
