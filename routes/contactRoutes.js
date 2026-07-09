const express = require('express');
const router = express.Router();
const {
  createContact,
  getAllMessages,
  markAsRead,
  deleteMessage,
} = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const { body } = require('express-validator');

const contactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
];

router.post('/', contactValidation, createContact);
router.get('/', protect, admin, getAllMessages);
router.put('/:id/read', protect, admin, markAsRead);
router.delete('/:id', protect, admin, deleteMessage);

// module.exports = router;
export default router;