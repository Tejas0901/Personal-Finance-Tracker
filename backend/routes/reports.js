const express = require('express');
const { query, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Initialize SQLite database
const dbPath = path.join(__dirname, '../database/reports.db');
const db = new sqlite3.Database(dbPath);

// Create tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS monthly_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    month TEXT NOT NULL,
    total_spent REAL NOT NULL,
    top_category TEXT,
    top_category_amount REAL,
    overbudget_categories TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_totals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    total_spending REAL DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Get dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const startOfMonth = new Date(currentMonth + '-01');
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

    // Current month total spending
    const totalSpending = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
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

    // Category with highest spending
    const topCategory = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 1
      }
    ]);

    // Top 3 payment methods
    const topPaymentMethods = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 3
      }
    ]);

    // Category-wise spending for pie chart
    const categorySpending = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Monthly spending trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Budget alerts
    const budgetAlerts = await Budget.aggregate([
      {
        $match: {
          user: req.user._id,
          month: currentMonth,
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'expenses',
          let: { budgetCategory: '$category', budgetMonth: '$month' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$user', req.user._id] },
                    { $eq: ['$category', '$$budgetCategory'] },
                    {
                      $gte: ['$date', new Date('$$budgetMonth-01')]
                    },
                    {
                      $lte: ['$date', new Date(new Date('$$budgetMonth-01').getFullYear(), new Date('$$budgetMonth-01').getMonth() + 1, 0)]
                    }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ],
          as: 'spending'
        }
      },
      {
        $addFields: {
          currentSpending: { $ifNull: [{ $arrayElemAt: ['$spending.total', 0] }, 0] }
        }
      },
      {
        $addFields: {
          spendingPercentage: {
            $cond: {
              if: { $gt: ['$amount', 0] },
              then: { $multiply: [{ $divide: ['$currentSpending', '$amount'] }, 100] },
              else: 0
            }
          }
        }
      },
      {
        $match: {
          $expr: {
            $gte: ['$spendingPercentage', '$alertThreshold']
          }
        }
      }
    ]);

    res.json({
      currentMonth: currentMonth,
      totalSpending: totalSpending[0]?.total || 0,
      topCategory: topCategory[0] || null,
      topPaymentMethods,
      categorySpending,
      monthlyTrend,
      budgetAlerts: budgetAlerts.map(budget => ({
        category: budget.category,
        budgetAmount: budget.amount,
        currentSpending: budget.currentSpending,
        spendingPercentage: budget.spendingPercentage,
        alertType: budget.spendingPercentage >= 100 ? 'exceeded' : 'warning'
      }))
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get monthly reports
router.get('/monthly', auth, [
  query('months').optional().isInt({ min: 1, max: 12 }).withMessage('Months must be between 1 and 12')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const months = parseInt(req.query.months) || 3;
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Get monthly reports from SQLite
    const reports = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM monthly_reports 
         WHERE user_id = ? 
         ORDER BY month DESC 
         LIMIT ?`,
        [req.user._id.toString(), months],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({ reports });
  } catch (error) {
    console.error('Get monthly reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate and save monthly report
router.post('/generate-monthly', auth, async (req, res) => {
  try {
    const { month } = req.body;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'Valid month in YYYY-MM format is required' });
    }

    const startOfMonth = new Date(month + '-01');
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

    // Get total spending for the month
    const totalSpending = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
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

    // Get top category
    const topCategory = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 1
      }
    ]);

    // Get overbudget categories
    const budgets = await Budget.find({
      user: req.user._id,
      month: month
    });

    const overbudgetCategories = [];
    for (const budget of budgets) {
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
      if (currentSpending > budget.amount) {
        overbudgetCategories.push({
          category: budget.category,
          budget: budget.amount,
          spent: currentSpending,
          overage: currentSpending - budget.amount
        });
      }
    }

    // Save to SQLite
    const reportData = {
      user_id: req.user._id.toString(),
      month: month,
      total_spent: totalSpending[0]?.total || 0,
      top_category: topCategory[0]?._id || null,
      top_category_amount: topCategory[0]?.total || 0,
      overbudget_categories: JSON.stringify(overbudgetCategories)
    };

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO monthly_reports 
         (user_id, month, total_spent, top_category, top_category_amount, overbudget_categories)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          reportData.user_id,
          reportData.month,
          reportData.total_spent,
          reportData.top_category,
          reportData.top_category_amount,
          reportData.overbudget_categories
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    res.json({
      message: 'Monthly report generated successfully',
      report: reportData
    });
  } catch (error) {
    console.error('Generate monthly report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all users' total spending
router.get('/admin/all-users-spending', adminAuth, async (req, res) => {
  try {
    const userTotals = await Expense.aggregate([
      {
        $group: {
          _id: '$user',
          totalSpending: { $sum: '$amount' },
          expenseCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$user._id',
          userName: '$user.name',
          userEmail: '$user.email',
          totalSpending: 1,
          expenseCount: 1
        }
      },
      {
        $sort: { totalSpending: -1 }
      }
    ]);

    res.json({ userTotals });
  } catch (error) {
    console.error('Admin get all users spending error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 