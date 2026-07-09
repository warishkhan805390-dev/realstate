const express = require('express');
const router = express.Router();
const {
  createReservation,
  getUserReservations,
  getAllReservations,
  updateReservationStatus,
  deleteReservation,
} = require('../controllers/reservationController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const { body } = require('express-validator');

const reservationValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').trim().notEmpty().withMessage('Time is required'),
  body('guests').isInt({ min: 1 }).withMessage('At least 1 guest required'),
];

router.post('/', protect, reservationValidation, createReservation);
router.get('/my', protect, getUserReservations);
router.get('/', protect, admin, getAllReservations);
router.put('/:id', protect, admin, updateReservationStatus);
router.delete('/:id', protect, admin, deleteReservation);

// module.exports = router;
export default router;
