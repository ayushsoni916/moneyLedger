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
      today.setHours(0, 0, 0, 0);

      const start = new Date(loan.startDate);
      start.setHours(0, 0, 0, 0);

      // NEXT DAY LOGIC:
      // We calculate the difference in days. If today is the same day as the start date, we consider 0 days have passed (Day 0). If today is the day after the start date, we consider 1 day has passed (Day 1), and so on.
      // If today is Feb 2 and start is Feb 1, diffDays = 1.
      const diffTime = today - start;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (loan.type === 'EMI') {
        // Only start counting EMIs if at least 1 full day has passed
        loanObj.expectedEmis = diffDays > 0 ? diffDays : 0;

        // Actual EMIs paid based on total money received
        loanObj.actualEmisPaid = loan.dailyKist > 0
          ? Math.floor(loan.paidAmount / loan.dailyKist)
          : 0;

        // Calculate missed EMIs
        loanObj.missedEmis = loanObj.expectedEmis > loanObj.actualEmisPaid
          ? loanObj.expectedEmis - loanObj.actualEmisPaid
          : 0;

        // Defaulted if they have missed at least 1 EMI
        loanObj.isDefaulted = loanObj.missedEmis > 0;
      } else {
        const dueDate = loan.dueDate ? new Date(loan.dueDate) : null;
        if (dueDate) dueDate.setHours(0, 0, 0, 0);

        const isPastDue = dueDate && today > dueDate;
        const isUnpaid = loan.paidAmount < loan.totalRepayable;
        loanObj.isDefaulted = isPastDue && isUnpaid;
      }
      return loanObj;
    });

    // --- PRIORITY SORTING ---
    // Defaulted (Missed/Overdue) loans move to the top of the profile list
   loans.sort((a, b) => (b.isDefaulted - a.isDefaulted));

    res.status(200).json({ client, loans });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};