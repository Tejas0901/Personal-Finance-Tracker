const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB for seeding'))
.catch(err => console.error('MongoDB connection error:', err));

// Sample data
const sampleUsers = [
  {
    name: 'Test User',
    email: 'user@example.com',
    password: '123456',
    role: 'user'
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  }
];

const sampleExpenses = [
  {
    amount: 1200,
    category: 'Food',
    date: new Date('2024-01-15'),
    paymentMethod: 'UPI',
    notes: 'Lunch at restaurant'
  },
  {
    amount: 500,
    category: 'Transportation',
    date: new Date('2024-01-16'),
    paymentMethod: 'Cash',
    notes: 'Fuel for bike'
  },
  {
    amount: 2500,
    category: 'Shopping',
    date: new Date('2024-01-17'),
    paymentMethod: 'Credit Card',
    notes: 'Clothes shopping'
  },
  {
    amount: 800,
    category: 'Food',
    date: new Date('2024-01-18'),
    paymentMethod: 'UPI',
    notes: 'Groceries'
  },
  {
    amount: 1500,
    category: 'Entertainment',
    date: new Date('2024-01-19'),
    paymentMethod: 'Debit Card',
    notes: 'Movie tickets'
  },
  {
    amount: 3000,
    category: 'Housing',
    date: new Date('2024-01-20'),
    paymentMethod: 'Bank Transfer',
    notes: 'Rent payment'
  },
  {
    amount: 600,
    category: 'Healthcare',
    date: new Date('2024-01-21'),
    paymentMethod: 'UPI',
    notes: 'Medicine'
  },
  {
    amount: 900,
    category: 'Food',
    date: new Date('2024-01-22'),
    paymentMethod: 'Cash',
    notes: 'Dinner with friends'
  }
];

const sampleBudgets = [
  {
    category: 'Food',
    amount: 5000,
    month: '2024-01',
    alertThreshold: 80
  },
  {
    category: 'Transportation',
    amount: 2000,
    month: '2024-01',
    alertThreshold: 80
  },
  {
    category: 'Shopping',
    amount: 3000,
    month: '2024-01',
    alertThreshold: 80
  },
  {
    category: 'Entertainment',
    amount: 2000,
    month: '2024-01',
    alertThreshold: 80
  }
];

async function seedDatabase() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Expense.deleteMany({});
    await Budget.deleteMany({});

    console.log('Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.email}`);
    }

    // Create expenses for the first user
    const testUser = createdUsers.find(u => u.email === 'user@example.com');
    if (testUser) {
      for (const expenseData of sampleExpenses) {
        const expense = new Expense({
          ...expenseData,
          user: testUser._id
        });
        await expense.save();
      }
      console.log(`Created ${sampleExpenses.length} expenses for test user`);
    }

    // Create budgets for the first user
    if (testUser) {
      for (const budgetData of sampleBudgets) {
        const budget = new Budget({
          ...budgetData,
          user: testUser._id
        });
        await budget.save();
      }
      console.log(`Created ${sampleBudgets.length} budgets for test user`);
    }

    console.log('Database seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('Regular User: user@example.com / 123456');
    console.log('Admin User: admin@example.com / admin123');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seed function
seedDatabase(); 