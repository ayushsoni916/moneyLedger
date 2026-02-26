const express = require('express');
const router = express.Router();
const { addClient, getClients, getClientProfile } = require('../controllers/clientController');

router.route('/').get(getClients).post(addClient);
router.route('/:id').get(getClientProfile); // NEW: Get profile by ID

module.exports = router;