const express = require('express');
const router = express.Router();

// Single user ID constant
const SINGLE_USER_ID = 1;

/**
 * @route GET /api/portfolio/overview
 * @desc Get portfolio overview (stocks only)
 * @access Public
 */
router.get('/overview', async (req, res) => {
  try {
    // Get stocks summary only
    const [stocksSummary] = await req.db.execute(`
      SELECT 
        COUNT(*) as total_stocks,
        SUM(quantity * purchase_price) as stocks_invested,
        SUM(quantity * COALESCE(current_price, purchase_price)) as stocks_current_value,
        SUM(quantity * (COALESCE(current_price, purchase_price) - purchase_price)) as stocks_gain_loss
      FROM stocks 
      WHERE user_id = ?
    `, [SINGLE_USER_ID]);

    const stocksData = stocksSummary[0];
    const totalInvested = parseFloat(stocksData.stocks_invested || 0);
    const totalCurrentValue = parseFloat(stocksData.stocks_current_value || 0);
    const totalGainLoss = parseFloat(stocksData.stocks_gain_loss || 0);

    res.json({
      overview: {
        totalInvested,
        totalCurrentValue,
        totalGainLoss,
        totalReturnPercentage: totalInvested > 0 ? ((totalGainLoss / totalInvested) * 100) : 0,
        totalAssets: stocksData.total_stocks
      },
      stocks: {
        count: stocksData.total_stocks,
        invested: totalInvested,
        currentValue: totalCurrentValue,
        gainLoss: totalGainLoss,
        percentage: 100
      }
    });
  } catch (error) {
    console.error('Error fetching portfolio overview:', error);
    res.status(500).json({ message: 'Server error fetching portfolio overview' });
  }
});

module.exports = router;