const express = require('express');
const Joi = require('joi');
const router = express.Router();

// Single user ID constant
const SINGLE_USER_ID = 1;

// Validation schemas
const cashflowSchema = Joi.object({
  type: Joi.string().valid('income', 'expense').required(),
  category: Joi.string().min(1).max(100).required(),
  amount: Joi.number().positive().required(),
  description: Joi.string().min(1).max(255).required(),
  date: Joi.date().required(),
  isRecurring: Joi.boolean().default(false),
  recurringFrequency: Joi.string().valid('daily', 'weekly', 'monthly', 'quarterly', 'yearly').optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional()
});

const updateCashflowSchema = Joi.object({
  category: Joi.string().min(1).max(100).optional(),
  amount: Joi.number().positive().optional(),
  description: Joi.string().min(1).max(255).optional(),
  date: Joi.date().optional(),
  isRecurring: Joi.boolean().optional(),
  recurringFrequency: Joi.string().valid('daily', 'weekly', 'monthly', 'quarterly', 'yearly').optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional()
});

/**
 * @route GET /api/cashflow
 * @desc Get all cashflow entries for the single user
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const { type, category, startDate, endDate, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        id, type, category, amount, description, date, 
        is_recurring, recurring_frequency, tags,
        created_at, updated_at
      FROM cashflow 
      WHERE user_id = ?
    `;
    const queryParams = [SINGLE_USER_ID];

    // Add filters
    if (type && ['income', 'expense'].includes(type)) {
      query += ' AND type = ?';
      queryParams.push(type);
    }

    if (category) {
      query += ' AND category = ?';
      queryParams.push(category);
    }

    if (startDate) {
      query += ' AND date >= ?';
      queryParams.push(startDate);
    }

    if (endDate) {
      query += ' AND date <= ?';
      queryParams.push(endDate);
    }

    query += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));

    const [cashflows] = await req.db.execute(query, queryParams);

    res.json({
      cashflows: cashflows.map(cf => ({
        id: cf.id,
        type: cf.type,
        category: cf.category,
        amount: parseFloat(cf.amount),
        description: cf.description,
        date: cf.date,
        isRecurring: cf.is_recurring,
        recurringFrequency: cf.recurring_frequency,
        tags: cf.tags ? JSON.parse(cf.tags) : [],
        createdAt: cf.created_at,
        updatedAt: cf.updated_at
      }))
    });
  } catch (error) {
    console.error('Error fetching cashflows:', error);
    res.status(500).json({ message: 'Server error fetching cashflows' });
  }
});

/**
 * @route POST /api/cashflow
 * @desc Add a new cashflow entry
 * @access Public
 */
router.post('/', async (req, res) => {
  try {
    // Validate input
    const { error } = cashflowSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { 
      type, category, amount, description, date, 
      isRecurring, recurringFrequency, tags 
    } = req.body;

    // Insert new cashflow entry
    const [result] = await req.db.execute(`
      INSERT INTO cashflow (
        user_id, type, category, amount, description, date,
        is_recurring, recurring_frequency, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      SINGLE_USER_ID, type, category, amount, description, date,
      isRecurring || false, recurringFrequency, JSON.stringify(tags || [])
    ]);

    // Get the inserted cashflow entry
    const [newCashflow] = await req.db.execute(
      'SELECT * FROM cashflow WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Cashflow entry added successfully',
      cashflow: {
        id: newCashflow[0].id,
        type: newCashflow[0].type,
        category: newCashflow[0].category,
        amount: parseFloat(newCashflow[0].amount),
        description: newCashflow[0].description,
        date: newCashflow[0].date,
        isRecurring: newCashflow[0].is_recurring,
        recurringFrequency: newCashflow[0].recurring_frequency,
        tags: JSON.parse(newCashflow[0].tags || '[]')
      }
    });
  } catch (error) {
    console.error('Error adding cashflow:', error);
    res.status(500).json({ message: 'Server error adding cashflow' });
  }
});

/**
 * @route PUT /api/cashflow/:id
 * @desc Update a cashflow entry
 * @access Public
 */
router.put('/:id', async (req, res) => {
  try {
    const cashflowId = parseInt(req.params.id);
    
    // Validate input
    const { error } = updateCashflowSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check if cashflow exists
    const [existingCashflows] = await req.db.execute(
      'SELECT id FROM cashflow WHERE id = ? AND user_id = ?',
      [cashflowId, SINGLE_USER_ID]
    );

    if (existingCashflows.length === 0) {
      return res.status(404).json({ message: 'Cashflow entry not found' });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    Object.keys(req.body).forEach(key => {
      const dbField = key === 'isRecurring' ? 'is_recurring' : 
                     key === 'recurringFrequency' ? 'recurring_frequency' : key;
      updateFields.push(`${dbField} = ?`);
      const value = key === 'tags' ? JSON.stringify(req.body[key]) : req.body[key];
      updateValues.push(value);
    });

    updateValues.push(cashflowId, SINGLE_USER_ID);

    await req.db.execute(`
      UPDATE cashflow 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `, updateValues);

    res.json({ message: 'Cashflow entry updated successfully' });
  } catch (error) {
    console.error('Error updating cashflow:', error);
    res.status(500).json({ message: 'Server error updating cashflow' });
  }
});

/**
 * @route DELETE /api/cashflow/:id
 * @desc Delete a cashflow entry
 * @access Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const cashflowId = parseInt(req.params.id);

    // Check if cashflow exists
    const [existingCashflows] = await req.db.execute(
      'SELECT id FROM cashflow WHERE id = ? AND user_id = ?',
      [cashflowId, SINGLE_USER_ID]
    );

    if (existingCashflows.length === 0) {
      return res.status(404).json({ message: 'Cashflow entry not found' });
    }

    // Delete cashflow entry
    await req.db.execute(
      'DELETE FROM cashflow WHERE id = ? AND user_id = ?',
      [cashflowId, SINGLE_USER_ID]
    );

    res.json({ message: 'Cashflow entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting cashflow:', error);
    res.status(500).json({ message: 'Server error deleting cashflow' });
  }
});

/**
 * @route GET /api/cashflow/summary
 * @desc Get cashflow summary for the single user
 * @access Public
 */
router.get('/summary', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    // Determine date range based on period
    let dateFilter = '';
    switch (period) {
      case 'weekly':
        dateFilter = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case 'monthly':
        dateFilter = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        break;
      case 'quarterly':
        dateFilter = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
        break;
      case 'yearly':
        dateFilter = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
        break;
      default:
        dateFilter = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }

    const [summary] = await req.db.execute(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
        COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count
      FROM cashflow 
      WHERE user_id = ? ${dateFilter}
    `, [SINGLE_USER_ID]);

    const summaryData = summary[0];
    const totalIncome = parseFloat(summaryData.total_income || 0);
    const totalExpenses = parseFloat(summaryData.total_expenses || 0);
    const netCashflow = totalIncome - totalExpenses;

    res.json({
      period,
      totalIncome,
      totalExpenses,
      netCashflow,
      incomeCount: summaryData.income_count,
      expenseCount: summaryData.expense_count,
      savingsRate: totalIncome > 0 ? ((netCashflow / totalIncome) * 100) : 0
    });
  } catch (error) {
    console.error('Error fetching cashflow summary:', error);
    res.status(500).json({ message: 'Server error fetching cashflow summary' });
  }
});

/**
 * @route GET /api/cashflow/categories
 * @desc Get cashflow categories with totals
 * @access Public
 */
router.get('/categories', async (req, res) => {
  try {
    const { type, period = 'monthly' } = req.query;
    
    let dateFilter = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    switch (period) {
      case 'weekly':
        dateFilter = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case 'quarterly':
        dateFilter = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
        break;
      case 'yearly':
        dateFilter = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
        break;
    }

    let query = `
      SELECT 
        category,
        type,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count,
        AVG(amount) as average_amount
      FROM cashflow 
      WHERE user_id = ? ${dateFilter}
    `;
    const queryParams = [SINGLE_USER_ID];

    if (type && ['income', 'expense'].includes(type)) {
      query += ' AND type = ?';
      queryParams.push(type);
    }

    query += ' GROUP BY category, type ORDER BY total_amount DESC';

    const [categories] = await req.db.execute(query, queryParams);

    res.json({
      categories: categories.map(cat => ({
        category: cat.category,
        type: cat.type,
        totalAmount: parseFloat(cat.total_amount),
        transactionCount: cat.transaction_count,
        averageAmount: parseFloat(cat.average_amount)
      }))
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

module.exports = router;