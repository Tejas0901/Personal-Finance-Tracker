const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all budgets for the authenticated user
router.get('/', auth, [
  query('month').optional().matches(/^\d{4}-\d{2}$/).withMessage('Month must be in YYYY-MM format'),
  query('category').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { month, category } = req.query;
    const filter = { user: req.user._id };

    if (month) filter.month = month;
    if (category) filter.category = category;

    const budgets = await Budget.find(filter).sort({ category: 1 });

    // Calculate current spending for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const startOfMonth = new Date(budget.month + '-01');
        const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

        const spending = await Expense.aggregate([
          {
            $match: {
              user: req.user._id,
              category: budget.category,
              date: { $gte: startOfMonth, $lte: endOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        const currentSpending = spending[0]?.total || 0;
        const spendingPercentage = budget.amount > 0 ? (currentSpending / budget.amount) * 100 : 0;

        return {
          ...budget.toObject(),
          currentSpending,
          spendingPercentage,
          alertStatus: spendingPercentage >= 100 ? 'exceeded' : 
                      spendingPercentage >= budget.alertThreshold ? 'warning' : 'normal'
        };
      })
    );

    res.json({ budgets: budgetsWithSpending });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get budget by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Calculate current spending
    const startOfMonth = new Date(budget.month + '-01');
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

    const spending = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          category: budget.category,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const currentSpending = spending[0]?.total || 0;
    const spendingPercentage = budget.amount > 0 ? (currentSpending / budget.amount) * 100 : 0;

    const budgetWithSpending = {
      ...budget.toObject(),
      currentSpending,
      spendingPercentage,
      alertStatus: spendingPercentage >= 100 ? 'exceeded' : 
                  spendingPercentage >= budget.alertThreshold ? 'warning' : 'normal'
    };

    res.json({ budget: budgetWithSpending });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new budget
router.post('/', auth, [
  body('category').isIn([
    'Food', 'Transportation', 'Shopping', 'Entertainment', 'Healthcare',
    'Education', 'Housing', 'Utilities', 'Insurance', 'Travel', 'Gifts', 'Other'
  ]).withMessage('Invalid category'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('month').matches(/^\d{4}-\d{2}$/).withMessage('Month must be in YYYY-MM format'),
  body('alertThreshold').optional().isFloat({ min: 0, max: 100 }).withMessage('Alert threshold must be between 0 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, amount, month, alertThreshold = 80 } = req.body;

    // Check if budget already exists for this user, category, and month
    const existingBudget = await Budget.findOne({
      user: req.user._id,
      category,
      month
    });

    if (existingBudget) {
      return res.status(400).json({ 
        message: `Budget for ${category} in ${month} already exists` 
      });
    }

    const budget = new Budget({
      user: req.user._id,
      category,
      amount,
      month,
      alertThreshold
    });

    await budget.save();

    res.status(201).json({
      message: 'Budget created successfully',
      budget
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update budget
router.put('/:id', auth, [
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('alertThreshold').optional().isFloat({ min: 0, max: 100 }).withMessage('Alert threshold must be between 0 and 100'),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json({
      message: 'Budget updated successfully',
      budget
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete budget
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get budget alerts
router.get('/alerts/current', auth, async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    const budgets = await Budget.find({
      user: req.user._id,
      month: currentMonth,
      isActive: true
    });

    const alerts = [];

    for (const budget of budgets) {
      const startOfMonth = new Date(budget.month + '-01');
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

      const spending = await Expense.aggregate([
        {
          $match: {
            user: req.user._id,
            category: budget.category,
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const currentSpending = spending[0]?.total || 0;
      const spendingPercentage = budget.amount > 0 ? (currentSpending / budget.amount) * 100 : 0;

      if (spendingPercentage >= budget.alertThreshold) {
        alerts.push({
          budgetId: budget._id,
          category: budget.category,
          budgetAmount: budget.amount,
          currentSpending,
          spendingPercentage,
          alertType: spendingPercentage >= 100 ? 'exceeded' : 'warning',
          message: spendingPercentage >= 100 
            ? `You have exceeded your ${budget.category} budget by ${(spendingPercentage - 100).toFixed(1)}%`
            : `You have used ${spendingPercentage.toFixed(1)}% of your ${budget.category} budget`
        });
      }
    }

    res.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 