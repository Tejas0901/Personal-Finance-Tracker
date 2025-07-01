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