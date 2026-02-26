const express = require('express');
const { addLoan, getCollections, recordPayment, getLoanHistory, getDashboardStats } = require('../controllers/loanController');
const router = express.Router();

router.route('/').post(addLoan)
router.get('/collections', getCollections);
router.patch('/:id/pay', recordPayment);
// NEW: History Timeline Route
router.get('/history', getLoanHistory);
router.get('/dashboard', getDashboardStats);

module.exports = router;