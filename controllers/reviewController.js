const Review = require('../models/Review');
const FoodItem = require('../models/FoodItem');
const { validationResult } = require('express-validator');

const createReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rating, comment, foodItem } = req.body;

  const food = await FoodItem.findById(foodItem);
  if (!food) {
    return res.status(404).json({ message: 'Food item not found' });
  }

  const existingReview = await Review.findOne({
    user: req.user._id,
    foodItem: foodItem,
  });

  if (existingReview) {
    return res.status(400).json({ message: 'You have already reviewed this item' });
  }

  const review = await Review.create({
    user: req.user._id,
    foodItem,
    rating,
    comment,
  });

  const reviews = await Review.find({ foodItem });
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / reviews.length;

  food.ratings = Math.round(averageRating * 10) / 10;
  food.numReviews = reviews.length;
  await food.save();

  const populatedReview = await Review.findById(review._id).populate('user', 'name avatar');

  res.status(201).json(populatedReview);
};

const getFoodReviews = async (req, res) => {
  const { foodId } = req.params;

  const food = await FoodItem.findById(foodId);
  if (!food) {
    return res.status(404).json({ message: 'Food item not found' });
  }

  const reviews = await Review.find({ foodItem: foodId })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });

  res.json(reviews);
};

const deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const foodItemId = review.foodItem;

  await Review.deleteOne({ _id: req.params.id });

  const remainingReviews = await Review.find({ foodItem: foodItemId });
  const food = await FoodItem.findById(foodItemId);

  if (food) {
    if (remainingReviews.length > 0) {
      const totalRating = remainingReviews.reduce((sum, r) => sum + r.rating, 0);
      food.ratings = Math.round((totalRating / remainingReviews.length) * 10) / 10;
    } else {
      food.ratings = 0;
    }
    food.numReviews = remainingReviews.length;
    await food.save();
  }

  res.json({ message: 'Review deleted successfully' });
};

const updateReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  if (review.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  review.rating = req.body.rating || review.rating;
  review.comment = req.body.comment !== undefined ? req.body.comment : review.comment;

  const updatedReview = await review.save();

  const reviews = await Review.find({ foodItem: review.foodItem });
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / reviews.length;

  const food = await FoodItem.findById(review.foodItem);
  if (food) {
    food.ratings = Math.round(averageRating * 10) / 10;
    food.numReviews = reviews.length;
    await food.save();
  }

  const populatedReview = await Review.findById(updatedReview._id).populate('user', 'name avatar');

  res.json(populatedReview);
};

module.exports = {
  createReview,
  getFoodReviews,
  deleteReview,
  updateReview,
};
