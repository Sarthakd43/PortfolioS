const express = require('express');
const router = express.Router();

/**
 * @route GET /api/auth/verify
 * @desc Mock verify endpoint for compatibility
 * @access Public
 */
router.get('/verify', (req, res) => {
  res.json({
    user: {
      id: 1,
      username: 'portfolio_user',
      email: 'user@portfolio.com',
      firstName: 'Portfolio',
      lastName: 'User'
    }
  });
});

module.exports = router;