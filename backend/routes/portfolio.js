const express = require('express');
const router = express.Router();

// Single user ID constant
const SINGLE_USER_ID = 1;

/**
 * @route GET /api/portfolio/overview
 * @desc Get complete portfolio overview
 * @access Public
 */
router.get('/overview', async (req, res) => {
  try {
    // Get stocks summary
    const [stocksSummary] = await req.db.execute(`
      SELECT 
        COUNT(*) as total_stocks,
        SUM(quantity * purchase_price) as stocks_invested,
        SUM(quantity * COALESCE(current_price, purchase_price)) as stocks_current_value,
        SUM(quantity * (COALESCE(current_price, purchase_price) - purchase_price)) as stocks_gain_loss
      FROM stocks 
      WHERE user_id = ?
    `, [SINGLE_USER_ID]);

    // Get bonds summary
    const [bondsSummary] = await req.db.execute(`
      SELECT 
        COUNT(*) as total_bonds,
        SUM(purchase_price) as bonds_invested,
        SUM(COALESCE(current_price, purchase_price)) as bonds_current_value,
        SUM(COALESCE(current_price, purchase_price) - purchase_price) as bonds_gain_loss,
        SUM(face_value * coupon_rate / 100) as bonds_annual_income
      FROM bonds 
      WHERE user_id = ?
    `, [SINGLE_USER_ID]);

    // Get recent cashflow (last 30 days)
    const [cashflowSummary] = await req.db.execute(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as recent_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as recent_expenses
      FROM cashflow 
      WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `, [SINGLE_USER_ID]);

    // Calculate totals
    const stocksData = stocksSummary[0];
    const bondsData = bondsSummary[0];
    const cashflowData = cashflowSummary[0];

    const totalInvested = parseFloat(stocksData.stocks_invested || 0) + parseFloat(bondsData.bonds_invested || 0);
    const totalCurrentValue = parseFloat(stocksData.stocks_current_value || 0) + parseFloat(bondsData.bonds_current_value || 0);
    const totalGainLoss = parseFloat(stocksData.stocks_gain_loss || 0) + parseFloat(bondsData.bonds_gain_loss || 0);
    const recentNetCashflow = parseFloat(cashflowData.recent_income || 0) - parseFloat(cashflowData.recent_expenses || 0);

    res.json({
      overview: {
        totalInvested,
        totalCurrentValue,
        totalGainLoss,
        totalReturnPercentage: totalInvested > 0 ? ((totalGainLoss / totalInvested) * 100) : 0,
        recentNetCashflow,
        totalAssets: stocksData.total_stocks + bondsData.total_bonds
      },
      stocks: {
        count: stocksData.total_stocks,
        invested: parseFloat(stocksData.stocks_invested || 0),
        currentValue: parseFloat(stocksData.stocks_current_value || 0),
        gainLoss: parseFloat(stocksData.stocks_gain_loss || 0),
        percentage: totalCurrentValue > 0 ? 
          ((parseFloat(stocksData.stocks_current_value || 0) / totalCurrentValue) * 100) : 0
      },
      bonds: {
        count: bondsData.total_bonds,
        invested: parseFloat(bondsData.bonds_invested || 0),
        currentValue: parseFloat(bondsData.bonds_current_value || 0),
        gainLoss: parseFloat(bondsData.bonds_gain_loss || 0),
        annualIncome: parseFloat(bondsData.bonds_annual_income || 0),
        percentage: totalCurrentValue > 0 ? 
          ((parseFloat(bondsData.bonds_current_value || 0) / totalCurrentValue) * 100) : 0
      },
      cashflow: {
        recentIncome: parseFloat(cashflowData.recent_income || 0),
        recentExpenses: parseFloat(cashflowData.recent_expenses || 0),
        netCashflow: recentNetCashflow
      }
    });
  } catch (error) {
    console.error('Error fetching portfolio overview:', error);
    res.status(500).json({ message: 'Server error fetching portfolio overview' });
  }
});

/**
 * @route GET /api/portfolio/performance
 * @desc Get portfolio performance metrics
 * @access Public
 */
router.get('/performance', async (req, res) => {
  try {
    const { period = '1y' } = req.query;
    
    // Determine date range
    let dateFilter = '';
    switch (period) {
      case '1m':
        dateFilter = 'DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
        break;
      case '3m':
        dateFilter = 'DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
        break;
      case '6m':
        dateFilter = 'DATE_SUB(CURDATE(), INTERVAL 6 MONTH)';
        break;
      case '1y':
        dateFilter = 'DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
        break;
      case 'all':
        dateFilter = '1900-01-01';
        break;
      default:
        dateFilter = 'DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
    }

    // Get stocks purchased in period
    const [stocksPerformance] = await req.db.execute(`
      SELECT 
        DATE(purchase_date) as date,
        SUM(quantity * purchase_price) as invested,
        SUM(quantity * COALESCE(current_price, purchase_price)) as current_value
      FROM stocks 
      WHERE user_id = ? AND purchase_date >= ?
      GROUP BY DATE(purchase_date)
      ORDER BY date ASC
    `, [SINGLE_USER_ID, dateFilter]);

    // Get bonds purchased in period
    const [bondsPerformance] = await req.db.execute(`
      SELECT 
        DATE(purchase_date) as date,
        SUM(purchase_price) as invested,
        SUM(COALESCE(current_price, purchase_price)) as current_value
      FROM bonds 
      WHERE user_id = ? AND purchase_date >= ?
      GROUP BY DATE(purchase_date)
      ORDER BY date ASC
    `, [SINGLE_USER_ID, dateFilter]);

    // Get cashflow in period
    const [cashflowPerformance] = await req.db.execute(`
      SELECT 
        DATE(date) as date,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
      FROM cashflow 
      WHERE user_id = ? AND date >= ?
      GROUP BY DATE(date)
      ORDER BY date ASC
    `, [SINGLE_USER_ID, dateFilter]);

    res.json({
      period,
      stocks: stocksPerformance.map(item => ({
        date: item.date,
        invested: parseFloat(item.invested),
        currentValue: parseFloat(item.current_value),
        return: parseFloat(item.current_value) - parseFloat(item.invested)
      })),
      bonds: bondsPerformance.map(item => ({
        date: item.date,
        invested: parseFloat(item.invested),
        currentValue: parseFloat(item.current_value),
        return: parseFloat(item.current_value) - parseFloat(item.invested)
      })),
      cashflow: cashflowPerformance.map(item => ({
        date: item.date,
        income: parseFloat(item.income),
        expenses: parseFloat(item.expenses),
        net: parseFloat(item.income) - parseFloat(item.expenses)
      }))
    });
  } catch (error) {
    console.error('Error fetching portfolio performance:', error);
    res.status(500).json({ message: 'Server error fetching portfolio performance' });
  }
});

/**
 * @route GET /api/portfolio/allocation
 * @desc Get portfolio asset allocation
 * @access Public
 */
router.get('/allocation', async (req, res) => {
  try {
    // Get stock allocation by sector
    const [stockSectors] = await req.db.execute(`
      SELECT 
        COALESCE(sector, 'Unknown') as sector,
        SUM(quantity * COALESCE(current_price, purchase_price)) as value,
        COUNT(*) as count
      FROM stocks 
      WHERE user_id = ?
      GROUP BY sector
      ORDER BY value DESC
    `, [SINGLE_USER_ID]);

    // Get bond allocation by type
    const [bondTypes] = await req.db.execute(`
      SELECT 
        bond_type,
        SUM(COALESCE(current_price, purchase_price)) as value,
        COUNT(*) as count
      FROM bonds 
      WHERE user_id = ?
      GROUP BY bond_type
      ORDER BY value DESC
    `, [SINGLE_USER_ID]);

    // Get total portfolio value
    const [totals] = await req.db.execute(`
      SELECT 
        (SELECT SUM(quantity * COALESCE(current_price, purchase_price)) FROM stocks WHERE user_id = ?) as stocks_total,
        (SELECT SUM(COALESCE(current_price, purchase_price)) FROM bonds WHERE user_id = ?) as bonds_total
    `, [SINGLE_USER_ID, SINGLE_USER_ID]);

    const stocksTotal = parseFloat(totals[0].stocks_total || 0);
    const bondsTotal = parseFloat(totals[0].bonds_total || 0);
    const totalValue = stocksTotal + bondsTotal;

    res.json({
      totalValue,
      assetClasses: [
        {
          name: 'Stocks',
          value: stocksTotal,
          percentage: totalValue > 0 ? ((stocksTotal / totalValue) * 100) : 0
        },
        {
          name: 'Bonds',
          value: bondsTotal,
          percentage: totalValue > 0 ? ((bondsTotal / totalValue) * 100) : 0
        }
      ],
      stockSectors: stockSectors.map(sector => ({
        sector: sector.sector,
        value: parseFloat(sector.value),
        percentage: stocksTotal > 0 ? ((parseFloat(sector.value) / stocksTotal) * 100) : 0,
        count: sector.count
      })),
      bondTypes: bondTypes.map(type => ({
        type: type.bond_type,
        value: parseFloat(type.value),
        percentage: bondsTotal > 0 ? ((parseFloat(type.value) / bondsTotal) * 100) : 0,
        count: type.count
      }))
    });
  } catch (error) {
    console.error('Error fetching portfolio allocation:', error);
    res.status(500).json({ message: 'Server error fetching portfolio allocation' });
  }
});

/**
 * @route GET /api/portfolio/alerts
 * @desc Get portfolio alerts and notifications
 * @access Public
 */
router.get('/alerts', async (req, res) => {
  try {
    const alerts = [];

    // Check for bonds maturing in next 30 days
    const [upcomingMaturities] = await req.db.execute(`
      SELECT issuer, maturity_date, face_value,
             DATEDIFF(maturity_date, CURDATE()) as days_to_maturity
      FROM bonds 
      WHERE user_id = ? 
        AND maturity_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY maturity_date ASC
    `, [SINGLE_USER_ID]);

    upcomingMaturities.forEach(bond => {
      alerts.push({
        type: 'bond_maturity',
        severity: bond.days_to_maturity <= 7 ? 'high' : 'medium',
        message: `Bond ${bond.issuer} matures in ${bond.days_to_maturity} days`,
        data: {
          issuer: bond.issuer,
          maturityDate: bond.maturity_date,
          faceValue: parseFloat(bond.face_value),
          daysToMaturity: bond.days_to_maturity
        }
      });
    });

    // Check for stocks with significant gains/losses (>20%)
    const [significantMovements] = await req.db.execute(`
      SELECT symbol, company_name, purchase_price, current_price,
             ((current_price - purchase_price) / purchase_price * 100) as percentage_change
      FROM stocks 
      WHERE user_id = ? 
        AND current_price IS NOT NULL
        AND ABS((current_price - purchase_price) / purchase_price * 100) >= 20
      ORDER BY ABS(percentage_change) DESC
    `, [SINGLE_USER_ID]);

    significantMovements.forEach(stock => {
      const isGain = stock.percentage_change > 0;
      alerts.push({
        type: isGain ? 'significant_gain' : 'significant_loss',
        severity: Math.abs(stock.percentage_change) >= 50 ? 'high' : 'medium',
        message: `${stock.symbol} has ${isGain ? 'gained' : 'lost'} ${Math.abs(stock.percentage_change).toFixed(1)}%`,
        data: {
          symbol: stock.symbol,
          companyName: stock.company_name,
          percentageChange: parseFloat(stock.percentage_change),
          currentPrice: parseFloat(stock.current_price),
          purchasePrice: parseFloat(stock.purchase_price)
        }
      });
    });

    res.json({ alerts });
  } catch (error) {
    console.error('Error fetching portfolio alerts:', error);
    res.status(500).json({ message: 'Server error fetching portfolio alerts' });
  }
});

module.exports = router;