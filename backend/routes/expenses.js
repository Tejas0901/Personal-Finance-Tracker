const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Expense = require('../models/Expense');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all expenses for the authenticated user with filtering
router.get('/', auth, [
  query('category').optional().isString(),
  query('paymentMethod').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      category,
      paymentMethod,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // Build filter object
    const filter = { user: req.user._id };

    if (category) filter.category = category;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { notes: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { paymentMethod: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get expenses with pagination
    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email');

    // Get total count for pagination
    const total = await Expense.countDocuments(filter);

    res.json({
      expenses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expense by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ expense });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new expense
router.post('/', auth, [
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category').isIn([
    'Food', 'Transportation', 'Shopping', 'Entertainment', 'Healthcare',
    'Education', 'Housing', 'Utilities', 'Insurance', 'Travel', 'Gifts', 'Other'
  ]).withMessage('Invalid category'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('paymentMethod').isIn([
    'Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Digital Wallet', 'Other'
  ]).withMessage('Invalid payment method'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  body('isRecurring').optional().isBoolean(),
  body('recurringType').optional().isIn(['daily', 'weekly', 'monthly', 'yearly'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = new Expense({
      ...req.body,
      user: req.user._id
    });

    await expense.save();
    await expense.populate('user', 'name email');

    res.status(201).json({
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update expense
router.put('/:id', auth, [
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category').optional().isIn([
    'Food', 'Transportation', 'Shopping', 'Entertainment', 'Healthcare',
    'Education', 'Housing', 'Utilities', 'Insurance', 'Travel', 'Gifts', 'Other'
  ]).withMessage('Invalid category'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('paymentMethod').optional().isIn([
    'Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Digital Wallet', 'Other'
  ]).withMessage('Invalid payment method'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  body('isRecurring').optional().isBoolean(),
  body('recurringType').optional().isIn(['daily', 'weekly', 'monthly', 'yearly'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expense statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = { user: req.user._id };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Total spending
    const totalSpending = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Category-wise spending
    const categorySpending = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    // Payment method usage
    const paymentMethodUsage = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    // Monthly spending trend
    const monthlyTrend = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      totalSpending: totalSpending[0]?.total || 0,
      categorySpending,
      paymentMethodUsage,
      monthlyTrend
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 