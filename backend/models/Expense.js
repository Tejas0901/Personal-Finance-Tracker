const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
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
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: [
      'Cash',
      'Credit Card',
      'Debit Card',
      'UPI',
      'Bank Transfer',
      'Digital Wallet',
      'Other'
    ]
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });
expenseSchema.index({ user: 1, paymentMethod: 1 });

// Virtual for formatted date
expenseSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString();
});

// Ensure virtuals are serialized
expenseSchema.set('toJSON', { virtuals: true });
expenseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Expense', expenseSchema); 