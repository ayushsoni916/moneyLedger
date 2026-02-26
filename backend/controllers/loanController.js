const Loan = require('../models/Loan');
const Client = require('../models/Client');

exports.addLoan = async (req, res) => {
  try {
    const {
      clientId, type, principal, totalRepayable,
      dailyKist, dueDate, startDate, initialPaidAmount, days
    } = req.body;

    // Build base object with common fields
    const loanData = {
      clientId,
      type,
      principal: Number(principal),
      totalRepayable: Number(totalRepayable),
      startDate: startDate || Date.now(),
      // Handle imported balance logic
      paidAmount: type === 'EMI'
        ? (Number(initialPaidAmount || 0) * Number(dailyKist || 0))
        : Number(initialPaidAmount || 0),
    };

    // Add type-specific fields safely
    if (type === 'EMI') {
      loanData.dailyKist = Number(dailyKist);
      loanData.totalDays = Number(days); // Only set if it's an EMI loan
    } else {
      loanData.dueDate = dueDate;
      // totalDays is NOT added here, avoiding the NaN error
    }

    // Add initial history if importing an existing loan
    if (loanData.paidAmount > 0) {
      loanData.history = [{
        amount: loanData.paidAmount,
        date: Date.now(),
        paymentType: 'Partial',
        note: 'Imported starting balance'
      }];
    }

    const newLoan = await Loan.create(loanData);

    // Sync with Client Model
    await Client.findByIdAndUpdate(clientId, { $inc: { loans: 1 } });

    res.status(201).json(newLoan);
  } catch (error) {
    console.error("Loan Creation Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCollections = async (req, res) => {
  try {
    const { type, sort } = req.query;
    let query = { status: 'Active' };
    if (type) query.type = type.toUpperCase();

    const rawLoans = await Loan.find(query)
      .populate('clientId', 'name phone')
      .lean();

    const today = new Date();

    const processedLoans = rawLoans.map(loan => {
      const start = new Date(loan.startDate);
      const elapsedDays = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
      
      let currentDue = 0;
      let isOverdue = false;

      if (loan.type === 'EMI') {
        const totalExpectedByToday = elapsedDays * loan.dailyKist;
        const unpaidBalance = totalExpectedByToday - loan.paidAmount;
        currentDue = unpaidBalance > 0 ? unpaidBalance : 0;
        isOverdue = currentDue > loan.dailyKist;
      } else {
        currentDue = loan.totalRepayable - loan.paidAmount;
        isOverdue = loan.dueDate && today > new Date(loan.dueDate);
      }

      return { ...loan, currentDue, isOverdue, baseAmount: loan.type === 'EMI' ? loan.dailyKist : loan.totalRepayable };
    })
    // NEW: Filter out any loans where nothing is due today
    .filter(loan => loan.currentDue > 0);

    // Sort: Overdue first, then by date
    processedLoans.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      return 0;
    });

    res.status(200).json(processedLoans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record a payment (Receive Full or Custom/Partial)
exports.recordPayment = async (req, res) => {
  try {
    const { amount, note } = req.body;
    const loan = await Loan.findById(req.params.id);

    if (!loan) return res.status(404).json({ message: "Loan not found" });

    const paymentAmount = Number(amount);
    
    // 1. Add to total paid
    loan.paidAmount += paymentAmount;

    // 2. Add to history ledger
    loan.history.push({
      amount: paymentAmount,
      date: Date.now(),
      paymentType: 'Partial',
      note: note || (loan.type === 'EMI' ? 'Daily Collection' : 'Fixed Repayment')
    });

    // 3. Auto-settle if the debt is cleared
    if (loan.paidAmount >= loan.totalRepayable) {
      loan.status = 'Settled';
    }

    await loan.save();
    res.status(200).json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLoanHistory = async (req, res) => {
  try {
    const { month, search } = req.query;

    // Fetch all active and settled loans to get their history
    const loans = await Loan.find()
      .populate('clientId', 'name')
      .lean();

    let allHistory = [];

    // Flatten history items into a single list
    loans.forEach(loan => {
      loan.history.forEach(entry => {
        allHistory.push({
          _id: entry._id,
          loanId: loan._id,
          clientName: loan.clientId?.name || 'Unknown',
          amount: entry.amount,
          date: entry.date,
          paymentType: entry.paymentType,
          loanType: loan.type,
          status: loan.status,
          note: entry.note
        });
      });
    });

    // Sort by most recent first
    allHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter by Month if provided (format: "February 2026")
    if (month) {
      allHistory = allHistory.filter(item => {
        const itemDate = new Date(item.date).toLocaleString('en-US', { month: 'long', year: 'numeric' });
        return itemDate === month;
      });
    }

    // Filter by Search (Client Name)
    if (search) {
      allHistory = allHistory.filter(item => 
        item.clientName.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.status(200).json(allHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const activeLoans = await Loan.find({ status: 'Active' }).populate('clientId', 'name');
    const allClientsCount = await Client.countDocuments();
    const activeLoansCount = activeLoans.length;

    let targetToday = 0;
    let receivedToday = 0;
    let totalMarketCap = 0;

    const overdueAlerts = [];
    const upcomingKists = [];

    // 1. Calculate Today's Target and Market Cap
    activeLoans.forEach(loan => {
      totalMarketCap += loan.principal;
      const start = new Date(loan.startDate);
      const elapsedDays = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24)) + 1;

      if (loan.type === 'EMI') {
        const expectedByToday = elapsedDays * loan.dailyKist;
        const unpaid = expectedByToday - loan.paidAmount;
        const dueToday = unpaid > 0 ? (unpaid > loan.dailyKist ? loan.dailyKist : unpaid) : 0;
        
        targetToday += dueToday;
        if (unpaid > loan.dailyKist) {
          overdueAlerts.push({ client: loan.clientId?.name, amount: unpaid, days: Math.floor(unpaid / loan.dailyKist) });
        }
        if (dueToday > 0) upcomingKists.push({ name: loan.clientId?.name, amount: dueToday });
      } else {
        const outstanding = loan.totalRepayable - loan.paidAmount;
        if (loan.dueDate && new Date(loan.dueDate) <= new Date()) {
          targetToday += outstanding;
          overdueAlerts.push({ client: loan.clientId?.name, amount: outstanding, isFixed: true });
        }
      }
    });

    // 2. Calculate Actual Received Today from History
    const loansWithTodayHistory = await Loan.find({
      "history.date": { $gte: todayStart, $lte: todayEnd }
    });

    loansWithTodayHistory.forEach(loan => {
      loan.history.forEach(entry => {
        if (entry.date >= todayStart && entry.date <= todayEnd) {
          receivedToday += entry.amount;
        }
      });
    });

    res.status(200).json({
      targetToday,
      receivedToday,
      totalMarketCap,
      totalClients: allClientsCount,
      activeLoansCount,
      overdueAlerts: overdueAlerts.slice(0, 3),
      upcomingKists: upcomingKists.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};