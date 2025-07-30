const express = require('express');
const Joi = require('joi');
const router = express.Router();

// Single user ID constant
const SINGLE_USER_ID = 1;

// Validation schemas
const bondSchema = Joi.object({
  issuer: Joi.string().min(1).max(255).required(),
  bondType: Joi.string().valid('government', 'corporate', 'municipal', 'treasury').required(),
  faceValue: Joi.number().positive().required(),
  couponRate: Joi.number().min(0).max(100).required(),
  maturityDate: Joi.date().greater('now').required(),
  purchasePrice: Joi.number().positive().required(),
  purchaseDate: Joi.date().required(),
  rating: Joi.string().max(10).optional(),
  notes: Joi.string().max(1000).optional()
});

const updateBondSchema = Joi.object({
  faceValue: Joi.number().positive().optional(),
  couponRate: Joi.number().min(0).max(100).optional(),
  purchasePrice: Joi.number().positive().optional(),
  currentPrice: Joi.number().positive().optional(),
  rating: Joi.string().max(10).optional(),
  notes: Joi.string().max(1000).optional()
});

/**
 * @route GET /api/bonds
 * @desc Get all bonds for the single user
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const [bonds] = await req.db.execute(`
      SELECT 
        id, issuer, bond_type, face_value, coupon_rate, maturity_date,
        purchase_price, current_price, purchase_date, rating, notes,
        COALESCE(current_price, purchase_price) as current_value,
        (COALESCE(current_price, purchase_price) - purchase_price) as gain_loss,
        DATEDIFF(maturity_date, CURDATE()) as days_to_maturity,
        (face_value * coupon_rate / 100) as annual_coupon,
        created_at, updated_at
      FROM bonds 
      WHERE user_id = ?
      ORDER BY maturity_date ASC
    `, [SINGLE_USER_ID]);

    res.json({
      bonds: bonds.map(bond => ({
        id: bond.id,
        issuer: bond.issuer,
        bondType: bond.bond_type,
        faceValue: parseFloat(bond.face_value),
        couponRate: parseFloat(bond.coupon_rate),
        maturityDate: bond.maturity_date,
        purchasePrice: parseFloat(bond.purchase_price),
        currentPrice: parseFloat(bond.current_price || bond.purchase_price),
        currentValue: parseFloat(bond.current_value),
        gainLoss: parseFloat(bond.gain_loss || 0),
        daysToMaturity: bond.days_to_maturity,
        annualCoupon: parseFloat(bond.annual_coupon),
        purchaseDate: bond.purchase_date,
        rating: bond.rating,
        notes: bond.notes,
        createdAt: bond.created_at,
        updatedAt: bond.updated_at
      }))
    });
  } catch (error) {
    console.error('Error fetching bonds:', error);
    res.status(500).json({ message: 'Server error fetching bonds' });
  }
});

/**
 * @route POST /api/bonds
 * @desc Add a new bond
 * @access Public
 */
router.post('/', async (req, res) => {
  try {
    // Validate input
    const { error } = bondSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { 
      issuer, bondType, faceValue, couponRate, maturityDate, 
      purchasePrice, purchaseDate, rating, notes 
    } = req.body;

    // Insert new bond
    const [result] = await req.db.execute(`
      INSERT INTO bonds (
        user_id, issuer, bond_type, face_value, coupon_rate, maturity_date,
        purchase_price, current_price, purchase_date, rating, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      SINGLE_USER_ID, issuer, bondType, faceValue, couponRate, maturityDate,
      purchasePrice, purchasePrice, purchaseDate, rating, notes
    ]);

    // Get the inserted bond
    const [newBond] = await req.db.execute(
      'SELECT * FROM bonds WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Bond added successfully',
      bond: {
        id: newBond[0].id,
        issuer: newBond[0].issuer,
        bondType: newBond[0].bond_type,
        faceValue: parseFloat(newBond[0].face_value),
        couponRate: parseFloat(newBond[0].coupon_rate),
        maturityDate: newBond[0].maturity_date,
        purchasePrice: parseFloat(newBond[0].purchase_price),
        currentPrice: parseFloat(newBond[0].current_price),
        purchaseDate: newBond[0].purchase_date,
        rating: newBond[0].rating,
        notes: newBond[0].notes
      }
    });
  } catch (error) {
    console.error('Error adding bond:', error);
    res.status(500).json({ message: 'Server error adding bond' });
  }
});

/**
 * @route PUT /api/bonds/:id
 * @desc Update a bond
 * @access Public
 */
router.put('/:id', async (req, res) => {
  try {
    const bondId = parseInt(req.params.id);
    
    // Validate input
    const { error } = updateBondSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check if bond exists
    const [existingBonds] = await req.db.execute(
      'SELECT id FROM bonds WHERE id = ? AND user_id = ?',
      [bondId, SINGLE_USER_ID]
    );

    if (existingBonds.length === 0) {
      return res.status(404).json({ message: 'Bond not found' });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    Object.keys(req.body).forEach(key => {
      const dbField = key === 'faceValue' ? 'face_value' : 
                     key === 'couponRate' ? 'coupon_rate' :
                     key === 'purchasePrice' ? 'purchase_price' :
                     key === 'currentPrice' ? 'current_price' : key;
      updateFields.push(`${dbField} = ?`);
      updateValues.push(req.body[key]);
    });

    updateValues.push(bondId, SINGLE_USER_ID);

    await req.db.execute(`
      UPDATE bonds 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `, updateValues);

    res.json({ message: 'Bond updated successfully' });
  } catch (error) {
    console.error('Error updating bond:', error);
    res.status(500).json({ message: 'Server error updating bond' });
  }
});

/**
 * @route DELETE /api/bonds/:id
 * @desc Delete a bond
 * @access Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const bondId = parseInt(req.params.id);

    // Check if bond exists
    const [existingBonds] = await req.db.execute(
      'SELECT id FROM bonds WHERE id = ? AND user_id = ?',
      [bondId, SINGLE_USER_ID]
    );

    if (existingBonds.length === 0) {
      return res.status(404).json({ message: 'Bond not found' });
    }

    // Delete bond
    await req.db.execute(
      'DELETE FROM bonds WHERE id = ? AND user_id = ?',
      [bondId, SINGLE_USER_ID]
    );

    res.json({ message: 'Bond deleted successfully' });
  } catch (error) {
    console.error('Error deleting bond:', error);
    res.status(500).json({ message: 'Server error deleting bond' });
  }
});

/**
 * @route GET /api/bonds/summary
 * @desc Get portfolio summary for bonds
 * @access Public
 */
router.get('/summary', async (req, res) => {
  try {
    const [summary] = await req.db.execute(`
      SELECT 
        COUNT(*) as total_bonds,
        SUM(purchase_price) as total_invested,
        SUM(COALESCE(current_price, purchase_price)) as current_value,
        SUM(COALESCE(current_price, purchase_price) - purchase_price) as total_gain_loss,
        SUM(face_value * coupon_rate / 100) as total_annual_income,
        AVG(coupon_rate) as average_coupon_rate
      FROM bonds 
      WHERE user_id = ?
    `, [SINGLE_USER_ID]);

    const summaryData = summary[0];
    
    res.json({
      totalBonds: summaryData.total_bonds,
      totalInvested: parseFloat(summaryData.total_invested || 0),
      currentValue: parseFloat(summaryData.current_value || 0),
      totalGainLoss: parseFloat(summaryData.total_gain_loss || 0),
      totalAnnualIncome: parseFloat(summaryData.total_annual_income || 0),
      averageCouponRate: parseFloat(summaryData.average_coupon_rate || 0),
      percentageReturn: summaryData.total_invested > 0 
        ? ((summaryData.total_gain_loss / summaryData.total_invested) * 100) 
        : 0
    });
  } catch (error) {
    console.error('Error fetching bond summary:', error);
    res.status(500).json({ message: 'Server error fetching bond summary' });
  }
});

/**
 * @route GET /api/bonds/upcoming-maturities
 * @desc Get bonds maturing in the next 90 days
 * @access Public
 */
router.get('/upcoming-maturities', async (req, res) => {
  try {
    const [bonds] = await req.db.execute(`
      SELECT 
        id, issuer, bond_type, face_value, maturity_date,
        DATEDIFF(maturity_date, CURDATE()) as days_to_maturity
      FROM bonds 
      WHERE user_id = ? 
        AND maturity_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
      ORDER BY maturity_date ASC
    `, [SINGLE_USER_ID]);

    res.json({
      upcomingMaturities: bonds.map(bond => ({
        id: bond.id,
        issuer: bond.issuer,
        bondType: bond.bond_type,
        faceValue: parseFloat(bond.face_value),
        maturityDate: bond.maturity_date,
        daysToMaturity: bond.days_to_maturity
      }))
    });
  } catch (error) {
    console.error('Error fetching upcoming maturities:', error);
    res.status(500).json({ message: 'Server error fetching upcoming maturities' });
  }
});

module.exports = router;