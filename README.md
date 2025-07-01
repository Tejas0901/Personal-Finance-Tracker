# Personal Finance Tracker+

A comprehensive full-stack web application for tracking personal expenses, managing budgets, and gaining insights into spending patterns.

## Features

### 📊 Dashboard with Interactive Charts
- **Pie Chart**: Visual representation of category-wise spending distribution
- **Line Chart**: Monthly spending trends over the last 6 months
- **Payment Methods Analysis**: Breakdown of spending by payment method
- **Real-time Insights**: Key metrics and spending patterns

### 💰 Expense Management
- Add, edit, and delete expenses
- Categorize expenses (Food, Rent, Shopping, etc.)
- Track payment methods (UPI, Credit Card, Cash)
- Add notes and dates to expenses
- Filter and search functionality

### 📋 Budget Management
- Set monthly spending limits for each category
- Real-time budget alerts (80% and 100% thresholds)
- Track budget vs actual spending

### 🤖 Smart Suggestions
- AI-powered spending analysis using Python
- Personalized recommendations for budget optimization
- Spending pattern recognition

### 📈 Reports & Analytics
- Monthly spending summaries
- Category-wise spending analysis
- Payment method usage statistics
- Historical spending trends

## Tech Stack

### Frontend
- **Next.js 14** with TypeScript
- **TailwindCSS** for styling
- **Chart.js** with react-chartjs-2 for data visualization
- **React Hook Form** for form management
- **Axios** for API communication

### Backend
- **Node.js** with Express.js
- **MongoDB** for main database
- **SQLite** for monthly reports
- **JWT** for authentication
- **bcryptjs** for password hashing

### Python Service
- **Flask** API for smart suggestions
- **Pandas** for data analysis
- **NumPy** for numerical computations

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB (local or cloud)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Personal-Finance-Tracker
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Update .env with your configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp env.example .env.local
   # Update .env.local with your configuration
   npm run dev
   ```

4. **Python Service Setup**
   ```bash
   cd python-service
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp env.example .env
   # Update .env with your configuration
   python app.py
   ```

### Environment Variables

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/personalFinanceTracker
JWT_SECRET=your-super-secret-jwt-key
PYTHON_SERVICE_URL=http://localhost:5001
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_JWT_STORAGE_KEY=finance_tracker_token
```

#### Python Service (.env)
```env
FLASK_APP=app.py
FLASK_ENV=development
PORT=5001
```

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Add Expenses**: Start tracking your daily expenses with categories and payment methods
3. **Set Budgets**: Define monthly spending limits for different categories
4. **View Dashboard**: Explore interactive charts and insights
5. **Get Suggestions**: Receive AI-powered recommendations for better financial management

## Chart Features

### Category Spending Pie Chart
- Visual breakdown of spending by category
- Interactive tooltips showing amounts and percentages
- Color-coded segments for easy identification
- Responsive design for all screen sizes

### Monthly Spending Trend Line Chart
- 6-month spending history visualization
- Smooth curve with gradient fill
- Hover effects showing exact amounts
- Y-axis formatted with currency symbols

### Payment Methods Analysis
- Card-based layout showing payment method usage
- Transaction count and total amount per method
- Percentage of total spending calculation
- Clean, modern design

### Spending Insights
- Key metrics summary cards
- Total spending calculation
- Top category identification with percentage
- Trend direction analysis (increasing/decreasing/stable)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Expenses
- `GET /api/expenses` - Get user expenses
- `POST /api/expenses` - Add new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Budgets
- `GET /api/budgets` - Get user budgets
- `POST /api/budgets` - Add new budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Reports
- `GET /api/reports/dashboard` - Get dashboard data (including charts)
- `GET /api/reports/monthly` - Get monthly reports
- `POST /api/reports/generate-monthly` - Generate monthly report

### Suggestions
- `GET /api/suggestions` - Get smart suggestions
- `POST /api/suggestions/analyze` - Analyze spending patterns

## Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy the .next folder
```

### Backend (Render/Railway)
```bash
cd backend
npm install
npm start
```

### Python Service (Render/Railway)
```bash
cd python-service
pip install -r requirements.txt
python app.py
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.