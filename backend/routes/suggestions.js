const express = require('express');
const axios = require('axios');
const Expense = require('../models/Expense');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get smart suggestions from Python service
router.post('/', auth, async (req, res) => {
  try {
    // Get user's expense data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expenses = await Expense.find({
      user: req.user._id,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 });

    if (expenses.length === 0) {
      return res.json({
        suggestions: [
          {
            type: 'info',
            message: 'No expense data available for the last 30 days. Start tracking your expenses to get personalized suggestions!'
          }
        ]
      });
    }

    // Prepare data for Python service
    const expenseData = expenses.map(expense => ({
      amount: expense.amount,
      category: expense.category,
      date: expense.date.toISOString().split('T')[0],
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || ''
    }));

    // Call Python service
    try {
      const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';
      const response = await axios.post(`${pythonServiceUrl}/analyze`, {
        expenses: expenseData,
        userId: req.user._id.toString(),
        userName: req.user.name
      }, {
        timeout: 10000 // 10 second timeout
      });

      res.json({
        suggestions: response.data.suggestions,
        analysis: response.data.analysis
      });
    } catch (pythonError) {
      console.error('Python service error:', pythonError);
      
      // Fallback suggestions if Python service is unavailable
      const fallbackSuggestions = generateFallbackSuggestions(expenses);
      
      res.json({
        suggestions: fallbackSuggestions,
        analysis: {
          totalSpending: expenses.reduce((sum, exp) => sum + exp.amount, 0),
          averageDailySpending: expenses.reduce((sum, exp) => sum + exp.amount, 0) / 30,
          topCategory: getTopCategory(expenses),
          message: 'Python service temporarily unavailable. Showing basic suggestions.'
        }
      });
    }
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get spending insights
router.get('/insights', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const expenses = await Expense.find({
      user: req.user._id,
      date: { $gte: startDate }
    });

    if (expenses.length === 0) {
      return res.json({
        insights: [],
        message: 'No expense data available for analysis.'
      });
    }

    // Calculate insights
    const insights = [];

    // Total spending insight
    const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const averageDailySpending = totalSpending / parseInt(days);
    
    insights.push({
      type: 'total',
      title: 'Total Spending',
      value: totalSpending,
      message: `You've spent ₹${totalSpending.toFixed(2)} in the last ${days} days`
    });

    // Daily average insight
    insights.push({
      type: 'average',
      title: 'Daily Average',
      value: averageDailySpending,
      message: `You spend an average of ₹${averageDailySpending.toFixed(2)} per day`
    });

    // Category insights
    const categoryTotals = {};
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];

    if (topCategory) {
      insights.push({
        type: 'category',
        title: 'Top Spending Category',
        value: topCategory[1],
        category: topCategory[0],
        message: `${topCategory[0]} is your highest spending category at ₹${topCategory[1].toFixed(2)}`
      });
    }

    // Payment method insights
    const paymentMethodCounts = {};
    expenses.forEach(expense => {
      paymentMethodCounts[expense.paymentMethod] = (paymentMethodCounts[expense.paymentMethod] || 0) + 1;
    });

    const topPaymentMethod = Object.entries(paymentMethodCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (topPaymentMethod) {
      insights.push({
        type: 'payment',
        title: 'Most Used Payment Method',
        value: topPaymentMethod[1],
        method: topPaymentMethod[0],
        message: `You use ${topPaymentMethod[0]} most frequently (${topPaymentMethod[1]} times)`
      });
    }

    // Spending trend insight
    const recentExpenses = expenses.filter(exp => 
      exp.date >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const recentTotal = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const previousWeekTotal = totalSpending - recentTotal;

    if (previousWeekTotal > 0) {
      const changePercentage = ((recentTotal - previousWeekTotal) / previousWeekTotal) * 100;
      insights.push({
        type: 'trend',
        title: 'Weekly Trend',
        value: changePercentage,
        message: changePercentage > 0 
          ? `Your spending increased by ${changePercentage.toFixed(1)}% this week`
          : `Your spending decreased by ${Math.abs(changePercentage).toFixed(1)}% this week`
      });
    }

    res.json({ insights });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to generate fallback suggestions
function generateFallbackSuggestions(expenses) {
  const suggestions = [];
  
  if (expenses.length === 0) {
    return suggestions;
  }

  const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const categoryTotals = {};
  
  expenses.forEach(expense => {
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
  });

  // Suggestion based on total spending
  if (totalSpending > 50000) {
    suggestions.push({
      type: 'warning',
      message: 'Your spending in the last 30 days is quite high. Consider reviewing your expenses and identifying areas to cut back.',
      priority: 'high'
    });
  }

  // Suggestion based on category spending
  const topCategory = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)[0];

  if (topCategory && topCategory[1] > totalSpending * 0.4) {
    suggestions.push({
      type: 'advice',
      message: `${topCategory[0]} accounts for a large portion of your spending. Consider setting a budget for this category.`,
      priority: 'medium'
    });
  }

  // General suggestion
  suggestions.push({
    type: 'tip',
    message: 'Track your expenses regularly to better understand your spending patterns and identify opportunities to save.',
    priority: 'low'
  });

  return suggestions;
}

// Helper function to get top category
function getTopCategory(expenses) {
  const categoryTotals = {};
  expenses.forEach(expense => {
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
  });

  return Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
}

module.exports = router; 