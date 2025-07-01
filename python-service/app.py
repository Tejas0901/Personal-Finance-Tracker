from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=[os.getenv('CORS_ORIGIN', 'http://localhost:3000')])

def convert_numpy_types(obj):
    """Convert numpy types to native Python types for JSON serialization"""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    return obj

class ExpenseAnalyzer:
    def __init__(self):
        self.spending_thresholds = {
            'low': 1000,
            'medium': 5000,
            'high': 10000
        }
    
    def analyze_expenses(self, expenses_data, user_id, user_name):
        """Analyze user expenses and provide smart suggestions"""
        if not expenses_data:
            return {
                'suggestions': [
                    {
                        'type': 'info',
                        'message': 'No expense data available for analysis.',
                        'priority': 'low'
                    }
                ],
                'analysis': {
                    'totalSpending': 0,
                    'averageDailySpending': 0,
                    'topCategory': 'None',
                    'message': 'Start tracking your expenses to get personalized insights!'
                }
            }
        
        # Convert to DataFrame
        df = pd.DataFrame(expenses_data)
        df['date'] = pd.to_datetime(df['date'])
        df['amount'] = pd.to_numeric(df['amount'])
        
        # Basic analysis
        total_spending = float(df['amount'].sum())
        average_daily = float(total_spending / 30)
        top_category = df.groupby('category')['amount'].sum().idxmax()
        top_category_amount = float(df.groupby('category')['amount'].sum().max())
        
        # Generate suggestions
        suggestions = self._generate_suggestions(df, total_spending, average_daily, top_category)
        
        # Detailed analysis
        analysis = self._detailed_analysis(df, total_spending, average_daily, top_category, top_category_amount)
        
        return {
            'suggestions': suggestions,
            'analysis': analysis
        }
    
    def _generate_suggestions(self, df, total_spending, average_daily, top_category):
        """Generate smart suggestions based on spending patterns"""
        suggestions = []
        
        # Spending level analysis
        if total_spending > self.spending_thresholds['high']:
            suggestions.append({
                'type': 'warning',
                'message': f'Your total spending of ₹{total_spending:,.2f} in the last 30 days is quite high. Consider reviewing your expenses and identifying areas to cut back.',
                'priority': 'high'
            })
        elif total_spending > self.spending_thresholds['medium']:
            suggestions.append({
                'type': 'advice',
                'message': f'Your spending of ₹{total_spending:,.2f} is moderate. Look for opportunities to optimize your budget.',
                'priority': 'medium'
            })
        
        # Category analysis
        category_totals = df.groupby('category')['amount'].sum()
        category_percentages = (category_totals / total_spending) * 100
        
        # Check for categories with high percentage
        for category, percentage in category_percentages.items():
            if percentage > 40:
                suggestions.append({
                    'type': 'advice',
                    'message': f'{category} accounts for {float(percentage):.1f}% of your spending. Consider setting a specific budget for this category.',
                    'priority': 'medium'
                })
        
        # Daily spending pattern analysis
        daily_spending = df.groupby(df['date'].dt.date)['amount'].sum()
        if len(daily_spending) > 1 and float(daily_spending.std()) > float(daily_spending.mean()) * 0.5:
            suggestions.append({
                'type': 'tip',
                'message': 'Your daily spending varies significantly. Try to maintain more consistent spending patterns.',
                'priority': 'low'
            })
        
        # Payment method analysis
        payment_methods = df['paymentMethod'].value_counts()
        if len(payment_methods) == 1:
            suggestions.append({
                'type': 'tip',
                'message': f'You only use {payment_methods.index[0]} for payments. Consider diversifying your payment methods for better tracking.',
                'priority': 'low'
            })
        
        # Recent spending trend
        recent_expenses = df[df['date'] >= datetime.now() - timedelta(days=7)]
        if len(recent_expenses) > 0:
            recent_total = float(recent_expenses['amount'].sum())
            previous_week_total = total_spending - recent_total
            if previous_week_total > 0:
                change_percentage = ((recent_total - previous_week_total) / previous_week_total) * 100
                if change_percentage > 20:
                    suggestions.append({
                        'type': 'warning',
                        'message': f'Your spending increased by {change_percentage:.1f}% this week compared to the previous week.',
                        'priority': 'medium'
                    })
                elif change_percentage < -20:
                    suggestions.append({
                        'type': 'positive',
                        'message': f'Great job! Your spending decreased by {abs(change_percentage):.1f}% this week.',
                        'priority': 'low'
                    })
        
        # Add general tips
        if len(suggestions) < 3:
            suggestions.append({
                'type': 'tip',
                'message': 'Track your expenses regularly to better understand your spending patterns and identify opportunities to save.',
                'priority': 'low'
            })
        
        return suggestions[:5]  # Limit to 5 suggestions
    
    def _detailed_analysis(self, df, total_spending, average_daily, top_category, top_category_amount):
        """Provide detailed spending analysis"""
        # Convert pandas series to dict and ensure values are native Python types
        category_breakdown = convert_numpy_types(df.groupby('category')['amount'].sum().to_dict())
        payment_method_breakdown = convert_numpy_types(df.groupby('paymentMethod')['amount'].sum().to_dict())
        
        # Calculate spending efficiency score
        efficiency_score = self._calculate_efficiency_score(df, total_spending)
        
        # Identify spending patterns
        patterns = self._identify_patterns(df)
        
        return {
            'totalSpending': float(total_spending),
            'averageDailySpending': float(average_daily),
            'topCategory': top_category,
            'topCategoryAmount': float(top_category_amount),
            'categoryBreakdown': category_breakdown,
            'paymentMethodBreakdown': payment_method_breakdown,
            'efficiencyScore': int(efficiency_score),
            'patterns': patterns,
            'message': f'Analysis complete for ₹{total_spending:,.2f} in spending over 30 days.'
        }
    
    def _calculate_efficiency_score(self, df, total_spending):
        """Calculate a spending efficiency score (0-100)"""
        score = 100
        
        # Deduct points for high variance in daily spending
        daily_spending = df.groupby(df['date'].dt.date)['amount'].sum()
        if len(daily_spending) > 1 and float(daily_spending.std()) > float(daily_spending.mean()) * 0.5:
            score -= 20
        
        # Deduct points for too many small transactions
        small_transactions = len(df[df['amount'] < 100])
        if small_transactions > len(df) * 0.3:
            score -= 15
        
        # Add points for consistent spending
        if len(daily_spending) > 1 and float(daily_spending.std()) < float(daily_spending.mean()) * 0.2:
            score += 10
        
        return max(0, min(100, score))
    
    def _identify_patterns(self, df):
        """Identify spending patterns"""
        patterns = []
        
        # Check for weekend spending
        weekend_spending = float(df[df['date'].dt.weekday >= 5]['amount'].sum())
        weekday_spending = float(df[df['date'].dt.weekday < 5]['amount'].sum())
        
        if weekday_spending > 0 and weekend_spending > weekday_spending * 1.5:
            patterns.append('Higher spending on weekends')
        
        # Check for recurring expenses
        category_counts = df['category'].value_counts()
        if len(category_counts) > 0 and int(category_counts.max()) > 5:
            patterns.append('Frequent expenses in certain categories')
        
        # Check for large transactions
        if len(df) > 0:
            large_transactions = df[df['amount'] > df['amount'].quantile(0.9)]
            if len(large_transactions) > 0:
                patterns.append('Occasional large transactions')
        
        return patterns

# Initialize analyzer
analyzer = ExpenseAnalyzer()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'expense-analyzer',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/analyze', methods=['POST'])
def analyze_expenses():
    """Analyze expenses and provide suggestions"""
    try:
        data = request.get_json()
        
        if not data or 'expenses' not in data:
            return jsonify({
                'error': 'Missing expenses data'
            }), 400
        
        expenses = data['expenses']
        user_id = data.get('userId', 'unknown')
        user_name = data.get('userName', 'User')
        
        # Analyze expenses
        result = analyzer.analyze_expenses(expenses, user_id, user_name)
        
        # Ensure result is JSON serializable
        result = convert_numpy_types(result)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'error': 'Analysis failed',
            'message': str(e)
        }), 500

@app.route('/insights', methods=['POST'])
def get_insights():
    """Get spending insights"""
    try:
        data = request.get_json()
        
        if not data or 'expenses' not in data:
            return jsonify({
                'error': 'Missing expenses data'
            }), 400
        
        expenses = data['expenses']
        days = data.get('days', 30)
        
        # Convert to DataFrame
        df = pd.DataFrame(expenses)
        df['date'] = pd.to_datetime(df['date'])
        df['amount'] = pd.to_numeric(df['amount'])
        
        # Calculate insights
        total_spending = float(df['amount'].sum())
        average_daily = float(total_spending / days)
        
        # Category insights
        category_totals = df.groupby('category')['amount'].sum()
        top_category = category_totals.idxmax() if len(category_totals) > 0 else 'None'
        
        # Payment method insights
        payment_totals = df.groupby('paymentMethod')['amount'].sum()
        top_payment = payment_totals.idxmax() if len(payment_totals) > 0 else 'None'
        
        insights = {
            'totalSpending': total_spending,
            'averageDailySpending': average_daily,
            'topCategory': top_category,
            'topPaymentMethod': top_payment,
            'categoryBreakdown': convert_numpy_types(category_totals.to_dict()),
            'paymentMethodBreakdown': convert_numpy_types(payment_totals.to_dict()),
            'transactionCount': int(len(df)),
            'daysAnalyzed': int(days)
        }
        
        return jsonify(insights)
        
    except Exception as e:
        return jsonify({
            'error': 'Insights generation failed',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development') 