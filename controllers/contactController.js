const Contact = require('../models/Contact');
const { validationResult } = require('express-validator');

const createContact = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, subject, message } = req.body;

  const contact = await Contact.create({ name, email, subject, message });

  res.status(201).json({ message: 'Message sent successfully', contact });
};

const getAllMessages = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.isRead !== undefined) {
    query.isRead = req.query.isRead === 'true';
  }

  const total = await Contact.countDocuments(query);
  const messages = await Contact.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.json({
    messages,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
};

const markAsRead = async (req, res) => {
  const message = await Contact.findById(req.params.id);
  if (!message) {
    return res.status(404).json({ message: 'Message not found' });
  }

  message.isRead = true;
  const updatedMessage = await message.save();

  res.json(updatedMessage);
};

const deleteMessage = async (req, res) => {
  const message = await Contact.findById(req.params.id);
  if (!message) {
    return res.status(404).json({ message: 'Message not found' });
  }

  await Contact.deleteOne({ _id: req.params.id });
  res.json({ message: 'Message deleted successfully' });
};

module.exports = {
  createContact,
  getAllMessages,
  markAsRead,
  deleteMessage,
};
