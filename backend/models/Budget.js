const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Food',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Healthcare',
      'Education',
      'Housing',
      'Utilities',
      'Insurance',
      'Travel',
      'Gifts',
      'Other'
    ]
  },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0, 'Budget amount cannot be negative']
  },
  month: {
    type: String,
    required: [true, 'Month is required'],
    // Format: YYYY-MM
    match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  alertThreshold: {
    type: Number,
    default: 80, // Percentage
    min: [0, 'Alert threshold cannot be negative'],
    max: [100, 'Alert threshold cannot exceed 100%']
  }
}, {
  timestamps: true
});

// Compound index to ensure unique budget per user, category, and month
budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });

// Virtual for current spending (will be calculated)
budgetSchema.virtual('currentSpending').get(function() {
  return 0; 
});

// Virtual for spending percentage
budgetSchema.virtual('spendingPercentage').get(function() {
  if (this.amount === 0) return 0;
  return (this.currentSpending / this.amount) * 100;
});

// Virtual for alert status
budgetSchema.virtual('alertStatus').get(function() {
  const percentage = this.spendingPercentage;
  if (percentage >= 100) return 'exceeded';
  if (percentage >= this.alertThreshold) return 'warning';
  return 'normal';
});

// Ensure virtuals are serialized
budgetSchema.set('toJSON', { virtuals: true });
budgetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Budget', budgetSchema); 