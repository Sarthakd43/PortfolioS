const express = require('express');
const Joi = require('joi');
const router = express.Router();

// Single user ID constant
const SINGLE_USER_ID = 1;

// Validation schemas
const stockSchema = Joi.object({
  symbol: Joi.string().uppercase().min(1).max(10).required(),
  companyName: Joi.string().min(1).max(255).required(),
  quantity: Joi.number().positive().required(),
  purchasePrice: Joi.number().positive().required(),
  purchaseDate: Joi.date().required(),
  sector: Joi.string().max(100).optional(),
  notes: Joi.string().max(1000).optional()
});

const updateStockSchema = Joi.object({
  quantity: Joi.number().positive().optional(),
  purchasePrice: Joi.number().positive().optional(),
  currentPrice: Joi.number().positive().optional(),
  sector: Joi.string().max(100).optional(),
  notes: Joi.string().max(1000).optional()
});

/**
 * @route GET /api/stocks
 * @desc Get all stocks for the single user
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const [stocks] = await req.db.execute(`
      SELECT 
        id, symbol, company_name, quantity, purchase_price, 
        current_price, purchase_date, sector, notes,
        (quantity * COALESCE(current_price, purchase_price)) as current_value,
        (quantity * (COALESCE(current_price, purchase_price) - purchase_price)) as unrealized_gain_loss,
        ((COALESCE(current_price, purchase_price) - purchase_price) / purchase_price * 100) as percentage_change,
        created_at, updated_at
      FROM stocks 
      WHERE user_id = ?
      ORDER BY symbol ASC
    `, [SINGLE_USER_ID]);

    res.json({
      stocks: stocks.map(stock => ({
        id: stock.id,
        symbol: stock.symbol,
        companyName: stock.company_name,
        quantity: stock.quantity,
        purchasePrice: parseFloat(stock.purchase_price),
        currentPrice: parseFloat(stock.current_price || stock.purchase_price),
        currentValue: parseFloat(stock.current_value || (stock.quantity * stock.purchase_price)),
        unrealizedGainLoss: parseFloat(stock.unrealized_gain_loss || 0),
        percentageChange: parseFloat(stock.percentage_change || 0),
        purchaseDate: stock.purchase_date,
        sector: stock.sector,
        notes: stock.notes,
        createdAt: stock.created_at,
        updatedAt: stock.updated_at
      }))
    });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ message: 'Server error fetching stocks' });
  }
});

/**
 * @route POST /api/stocks
 * @desc Add a new stock
 * @access Public
 */
router.post('/', async (req, res) => {
  try {
    // Validate input
    const { error } = stockSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { symbol, companyName, quantity, purchasePrice, purchaseDate, sector, notes } = req.body;

    // Check if stock already exists for this user
    const [existingStocks] = await req.db.execute(
      'SELECT id FROM stocks WHERE user_id = ? AND symbol = ?',
      [SINGLE_USER_ID, symbol]
    );

    if (existingStocks.length > 0) {
      return res.status(400).json({ message: 'Stock already exists in portfolio' });
    }

    // Insert new stock
    const [result] = await req.db.execute(`
      INSERT INTO stocks (
        user_id, symbol, company_name, quantity, purchase_price, 
        current_price, purchase_date, sector, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [SINGLE_USER_ID, symbol, companyName, quantity, purchasePrice, purchasePrice, purchaseDate, sector, notes]);

    // Get the inserted stock
    const [newStock] = await req.db.execute(
      'SELECT * FROM stocks WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Stock added successfully',
      stock: {
        id: newStock[0].id,
        symbol: newStock[0].symbol,
        companyName: newStock[0].company_name,
        quantity: newStock[0].quantity,
        purchasePrice: parseFloat(newStock[0].purchase_price),
        currentPrice: parseFloat(newStock[0].current_price),
        purchaseDate: newStock[0].purchase_date,
        sector: newStock[0].sector,
        notes: newStock[0].notes
      }
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({ message: 'Server error adding stock' });
  }
});

/**
 * @route PUT /api/stocks/:id
 * @desc Update a stock
 * @access Public
 */
router.put('/:id', async (req, res) => {
  try {
    const stockId = parseInt(req.params.id);
    
    // Validate input
    const { error } = updateStockSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check if stock exists
    const [existingStocks] = await req.db.execute(
      'SELECT id FROM stocks WHERE id = ? AND user_id = ?',
      [stockId, SINGLE_USER_ID]
    );

    if (existingStocks.length === 0) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    Object.keys(req.body).forEach(key => {
      const dbField = key === 'currentPrice' ? 'current_price' : 
                     key === 'purchasePrice' ? 'purchase_price' : key;
      updateFields.push(`${dbField} = ?`);
      updateValues.push(req.body[key]);
    });

    updateValues.push(stockId, SINGLE_USER_ID);

    await req.db.execute(`
      UPDATE stocks 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `, updateValues);

    res.json({ message: 'Stock updated successfully' });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ message: 'Server error updating stock' });
  }
});

/**
 * @route DELETE /api/stocks/:id
 * @desc Delete a stock
 * @access Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const stockId = parseInt(req.params.id);

    // Check if stock exists
    const [existingStocks] = await req.db.execute(
      'SELECT id FROM stocks WHERE id = ? AND user_id = ?',
      [stockId, SINGLE_USER_ID]
    );

    if (existingStocks.length === 0) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    // Delete stock
    await req.db.execute(
      'DELETE FROM stocks WHERE id = ? AND user_id = ?',
      [stockId, SINGLE_USER_ID]
    );

    res.json({ message: 'Stock deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock:', error);
    res.status(500).json({ message: 'Server error deleting stock' });
  }
});

/**
 * @route GET /api/stocks/summary
 * @desc Get portfolio summary for stocks
 * @access Public
 */
router.get('/summary', async (req, res) => {
  try {
    const [summary] = await req.db.execute(`
      SELECT 
        COUNT(*) as total_stocks,
        SUM(quantity * purchase_price) as total_invested,
        SUM(quantity * COALESCE(current_price, purchase_price)) as current_value,
        SUM(quantity * (COALESCE(current_price, purchase_price) - purchase_price)) as total_gain_loss
      FROM stocks 
      WHERE user_id = ?
    `, [SINGLE_USER_ID]);

    const summaryData = summary[0];
    
    res.json({
      totalStocks: summaryData.total_stocks,
      totalInvested: parseFloat(summaryData.total_invested || 0),
      currentValue: parseFloat(summaryData.current_value || 0),
      totalGainLoss: parseFloat(summaryData.total_gain_loss || 0),
      percentageReturn: summaryData.total_invested > 0 
        ? ((summaryData.total_gain_loss / summaryData.total_invested) * 100) 
        : 0
    });
  } catch (error) {
    console.error('Error fetching stock summary:', error);
    res.status(500).json({ message: 'Server error fetching stock summary' });
  }
});

module.exports = router;