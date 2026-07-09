const FoodItem = require('../models/FoodItem');
const Review = require('../models/Review');
const { validationResult } = require('express-validator');
const cloudinary = require('cloudinary').v2;

const getFoodItems = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.category) {
    query.category = req.query.category;
  }

  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: 'i' };
  }

  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
  }

  if (req.query.isAvailable !== undefined) {
    query.isAvailable = req.query.isAvailable === 'true';
  }

  const sort = {};
  if (req.query.sortBy === 'price') {
    sort.price = req.query.sortOrder === 'desc' ? -1 : 1;
  } else if (req.query.sortBy === 'rating') {
    sort.ratings = req.query.sortOrder === 'desc' ? -1 : 1;
  } else {
    sort.createdAt = -1;
  }

  const total = await FoodItem.countDocuments(query);
  const foodItems = await FoodItem.find(query)
    .populate('category', 'name')
    .skip(skip)
    .limit(limit)
    .sort(sort);

  res.json({
    foodItems,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
};

const getFoodById = async (req, res) => {
  const foodItem = await FoodItem.findById(req.params.id)
    .populate('category', 'name')
    .populate({
      path: 'reviews',
      options: { sort: { createdAt: -1 } },
    });

  if (!foodItem) {
    return res.status(404).json({ message: 'Food item not found' });
  }

  const reviews = await Review.find({ foodItem: req.params.id })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });

  res.json({ foodItem, reviews });
};

const createFood = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, price, category, image, isAvailable, isFeatured } = req.body;

  const foodItem = await FoodItem.create({
    name,
    description,
    price,
    category,
    image,
    isAvailable,
    isFeatured,
  });

  const createdFood = await FoodItem.findById(foodItem._id).populate('category', 'name');
  res.status(201).json(createdFood);
};

const updateFood = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const foodItem = await FoodItem.findById(req.params.id);
  if (!foodItem) {
    return res.status(404).json({ message: 'Food item not found' });
  }

  foodItem.name = req.body.name || foodItem.name;
  foodItem.description = req.body.description || foodItem.description;
  foodItem.price = req.body.price || foodItem.price;
  foodItem.category = req.body.category || foodItem.category;
  foodItem.image = req.body.image || foodItem.image;
  foodItem.isAvailable =
    req.body.isAvailable !== undefined ? req.body.isAvailable : foodItem.isAvailable;
  foodItem.isFeatured =
    req.body.isFeatured !== undefined ? req.body.isFeatured : foodItem.isFeatured;

  const updatedFood = await foodItem.save();
  const populatedFood = await FoodItem.findById(updatedFood._id).populate('category', 'name');
  res.json(populatedFood);
};

const deleteFood = async (req, res) => {
  const foodItem = await FoodItem.findById(req.params.id);
  if (!foodItem) {
    return res.status(404).json({ message: 'Food item not found' });
  }

  if (foodItem.image && foodItem.image.publicId) {
    await cloudinary.uploader.destroy(foodItem.image.publicId);
  }

  await Review.deleteMany({ foodItem: req.params.id });
  await FoodItem.deleteOne({ _id: req.params.id });

  res.json({ message: 'Food item deleted successfully' });
};

const getFeaturedFood = async (req, res) => {
  const foodItems = await FoodItem.find({ isFeatured: true, isAvailable: true })
    .populate('category', 'name')
    .limit(8);

  res.json(foodItems);
};

const uploadFoodImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  res.json({
    url: req.file.path,
    publicId: req.file.filename,
  });
};

module.exports = {
  getFoodItems,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
  getFeaturedFood,
  uploadFoodImage,
};
