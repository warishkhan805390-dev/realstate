const Category = require('../models/Category');
const FoodItem = require('../models/FoodItem');
const { validationResult } = require('express-validator');

const getCategories = async (req, res) => {
  const query = {};
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  const categories = await Category.find(query).sort({ name: 1 });
  res.json(categories);
};

const getCategoryById = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }
  res.json(category);
};

const createCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, image, isActive } = req.body;

  const existingCategory = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
  if (existingCategory) {
    return res.status(400).json({ message: 'Category already exists' });
  }

  const category = await Category.create({ name, description, image, isActive });
  res.status(201).json(category);
};

const updateCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  if (req.body.name && req.body.name.toLowerCase() !== category.name.toLowerCase()) {
    const existingCategory = await Category.findOne({
      name: { $regex: `^${req.body.name}$`, $options: 'i' },
      _id: { $ne: req.params.id },
    });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category name already exists' });
    }
  }

  category.name = req.body.name || category.name;
  category.description = req.body.description || category.description;
  category.image = req.body.image || category.image;
  category.isActive =
    req.body.isActive !== undefined ? req.body.isActive : category.isActive;

  const updatedCategory = await category.save();
  res.json(updatedCategory);
};

const deleteCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const foodCount = await FoodItem.countDocuments({ category: req.params.id });
  if (foodCount > 0) {
    return res.status(400).json({
      message: `Cannot delete category. ${foodCount} food items are associated with it.`,
    });
  }

  await Category.deleteOne({ _id: req.params.id });
  res.json({ message: 'Category deleted successfully' });
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
