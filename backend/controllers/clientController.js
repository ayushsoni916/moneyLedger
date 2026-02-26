const Client = require('../models/Client');
const Loan = require('../models/Loan');

// @desc    Register a new client
// @route   POST /api/clients
exports.addClient = async (req, res) => {
  try {
    const { name, phone, area, trustStatus } = req.body;

    // Check if client already exists
    const clientExists = await Client.findOne({ phone });
    if (clientExists) {
      return res.status(400).json({ message: 'Client with this phone already exists' });
    }

    const client = await Client.create({ name, phone, area, trustStatus });
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all clients
// @route   GET /api/clients
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getClientProfile = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });

    const rawLoans = await Loan.find({ clientId: req.params.id }).sort({ createdAt: -1 });

    const loans = rawLoans.map(loan => {
      const loanObj = loan.toObject();
      const today = new Date();
      const start = new Date(loan.startDate);

      // Calculate elapsed days for EMI logic
      const elapsedDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));

      if (loan.type === 'EMI') {
        loanObj.expectedEmis = elapsedDays > 0 ? elapsedDays : 0;
        loanObj.actualEmisPaid = Math.floor(loan.paidAmount / loan.dailyKist);
        loanObj.missedEmis = loanObj.expectedEmis > loanObj.actualEmisPaid
          ? loanObj.expectedEmis - loanObj.actualEmisPaid
          : 0;
        loanObj.isDefaulted = loanObj.missedEmis > 0;
      } else {
        // Fixed Loan Logic: Defaulted if today is past dueDate and not fully paid
        loanObj.isDefaulted = loan.dueDate && today > new Date(loan.dueDate) && loan.paidAmount < loan.totalRepayable;
      }
      return loanObj;
    });

    // Sort: Defaulted/Missed loans come first
    loans.sort((a, b) => (b.isDefaulted === a.isDefaulted) ? 0 : b.isDefaulted ? 1 : -1);

    res.status(200).json({ client, loans });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};