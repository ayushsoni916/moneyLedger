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

      // NEXT DAY LOGIC: 
      // Math.floor ensures that if less than 24 hours have passed, elapsedDays is 0.
      // Example: Loan given today at 2 PM. Tomorrow at 3 PM, elapsedDays = 1.
      const elapsedDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));

      if (loan.type === 'EMI') {
        // Only start counting EMIs if at least 1 full day has passed
        loanObj.expectedEmis = elapsedDays > 0 ? elapsedDays : 0;
        
        // Actual EMIs paid based on total money received
        loanObj.actualEmisPaid = Math.floor(loan.paidAmount / loan.dailyKist);
        
        // Calculate missed EMIs
        loanObj.missedEmis = loanObj.expectedEmis > loanObj.actualEmisPaid
          ? loanObj.expectedEmis - loanObj.actualEmisPaid
          : 0;
          
        // Defaulted if they have missed at least 1 EMI
        loanObj.isDefaulted = loanObj.missedEmis > 0;
      } else {
        // Fixed Loan Logic: Defaulted if today is past dueDate and not fully paid
        const isPastDue = loan.dueDate && today > new Date(loan.dueDate);
        const isUnpaid = loan.paidAmount < loan.totalRepayable;
        loanObj.isDefaulted = isPastDue && isUnpaid;
      }
      return loanObj;
    });

    // --- PRIORITY SORTING ---
    // Defaulted (Missed/Overdue) loans move to the top of the profile list
    loans.sort((a, b) => {
      if (a.isDefaulted === b.isDefaulted) return 0;
      return a.isDefaulted ? -1 : 1; 
    });

    res.status(200).json({ client, loans });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};