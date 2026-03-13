const Loan = require('../models/Loan');
const Client = require('../models/Client');

exports.addLoan = async (req, res) => {
  try {
    const {
      clientId, type, principal, totalRepayable,
      dailyKist, dueDate, startDate, initialPaidAmount, days, security
    } = req.body;

    // Build base object with common fields
    const loanData = {
      clientId,
      type,
      principal: Number(principal),
      totalRepayable: Number(totalRepayable),
      startDate: startDate || Date.now(),
      security: security || "",
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
        date: startDate || Date.now(),
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
    const { type } = req.query;
    let query = { status: 'Active' };
    if (type) query.type = type.toUpperCase();

    const rawLoans = await Loan.find(query).populate('clientId', 'name phone').lean();
    const today = new Date();

    const processedLoans = rawLoans.map(loan => {
      const start = new Date(loan.startDate);
      // NEXT DAY LOGIC: Subtract 1 so today (Day 0) returns 0 elapsed days
      const daysSinceStart = Math.floor((today - start) / (1000 * 60 * 60 * 24));
      const elapsedDays = daysSinceStart > 0 ? daysSinceStart : 0;

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
    }).filter(loan => loan.currentDue > 0);

    res.status(200).json(processedLoans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.recordPayment = async (req, res) => {
  try {
    const { amount, note } = req.body;
    const loan = await Loan.findById(req.params.id);

    if (!loan) return res.status(404).json({ message: "Loan not found" });

    const paymentAmount = Number(amount);
    let calculatedPaymentType = 'Partial';

    // 1. Determine Payment Type Logic
    if (loan.type === 'EMI') {
      const kist = loan.dailyKist || 0;

      if (paymentAmount > kist) {
        calculatedPaymentType = 'Advance';
      } else if (paymentAmount === kist) {
        calculatedPaymentType = 'Full';
      } else {
        calculatedPaymentType = 'Partial';
      }
    } else {
      // For FIXED loans, compare against the total remaining balance
      const remainingBalance = loan.totalRepayable - loan.paidAmount;

      if (paymentAmount > remainingBalance) {
        calculatedPaymentType = 'Advance';
      } else if (paymentAmount === remainingBalance) {
        calculatedPaymentType = 'Full';
      } else {
        calculatedPaymentType = 'Partial';
      }
    }

    // 2. Add to total paid
    loan.paidAmount += paymentAmount;

    // 3. Add to history ledger with the calculated type
    loan.history.push({
      amount: paymentAmount,
      date: Date.now(),
      paymentType: calculatedPaymentType,
      note: note || (loan.type === 'EMI' ? 'Daily Collection' : 'Fixed Repayment')
    });

    // 4. Auto-settle if the debt is cleared
    if (loan.paidAmount >= loan.totalRepayable) {
      loan.status = 'Settled';
    }

    await loan.save();
    res.status(200).json(loan);
  } catch (error) {
    console.error("Payment Recording Error:", error);
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
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const activeLoans = await Loan.find({ status: 'Active' }).populate('clientId', 'name phone');
    
    let targetEMI = 0, receivedEMI = 0;
    let targetFixed = 0, receivedFixed = 0;
    let totalMarketCap = 0;
    
    const overdueAlerts = [];
    const upcomingKists = [];

    activeLoans.forEach(loan => {
      totalMarketCap += (loan.principal || 0);

      const start = new Date(loan.startDate);
      start.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
      
      const hasPaidToday = loan.history.some(entry => 
        new Date(entry.date) >= todayStart && new Date(entry.date) <= todayEnd
      );

      // --- 1. EMI TARGET (The "What I Want" Logic) ---
      if (loan.type === 'EMI' && diffDays > 0) {
        const kist = loan.dailyKist || 0;
        const actualPaidCount = Math.floor(Math.max(0, loan.paidAmount) / kist);
        
        // Target: Even if they paid, we still "wanted" 1 kist today.
        // If they missed 2 days previously, we "wanted" 3 kists total by tonight.
        const totalExpectedByNow = diffDays;
        const missedCount = totalExpectedByNow > actualPaidCount ? totalExpectedByNow - actualPaidCount : 0;

        // CRITICAL FIX: The target for today is at least 1 Kist if the loan is active,
        // plus any missed ones. We calculate this REGARDLESS of hasPaidToday.
        // But we subtract today's payment from the target ONLY IF it was paid BEFORE today (Advance).
        
        const effectiveMissed = Math.max(0, totalExpectedByNow - actualPaidCount);
        
        // If they are NOT in advance, they contribute to today's target
        if (actualPaidCount < diffDays) {
           targetEMI += (effectiveMissed * kist);
        } else if (hasPaidToday) {
           // If they paid TODAY, they were part of today's target
           targetEMI += kist;
        }

        // Only show in lists if they still haven't cleared today's requirement
        if (!hasPaidToday && actualPaidCount < diffDays) {
          upcomingKists.push({ clientName: loan.clientId?.name, amount: kist, loanId: loan._id, type: 'EMI' });
          if (effectiveMissed > 1) {
            overdueAlerts.push({ clientName: loan.clientId?.name, amount: kist, days: effectiveMissed - 1, type: 'EMI' });
          }
        }
      } 
      
      // --- 2. FIXED TARGET ---
      else if (loan.type === 'FIXED') {
        const isDueOrOverdue = loan.dueDate && new Date(loan.dueDate) <= todayEnd;
        const remainingAtStartOfToday = loan.totalRepayable - (loan.paidAmount - (hasPaidToday ? loan.history.find(h => h.date >= todayStart).amount : 0));

        if (isDueOrOverdue && remainingAtStartOfToday > 0) {
          targetFixed += remainingAtStartOfToday;

          if (!hasPaidToday) {
            upcomingKists.push({ clientName: loan.clientId?.name, amount: remainingAtStartOfToday, loanId: loan._id, type: 'FIXED' });
            overdueAlerts.push({ clientName: loan.clientId?.name, amount: remainingAtStartOfToday, isFixed: true, type: 'FIXED' });
          }
        }
      }
    });

    // --- 3. RECEIVED TODAY ---
    const historyToday = await Loan.find({ "history.date": { $gte: todayStart, $lte: todayEnd } });
    historyToday.forEach(loan => {
      loan.history.forEach(entry => {
        if (entry.date >= todayStart && entry.date <= todayEnd) {
          if (loan.type === 'EMI') receivedEMI += entry.amount;
          else if (loan.type === 'FIXED') receivedFixed += entry.amount;
        }
      });
    });

    res.status(200).json({
      emi: { target: targetEMI, received: receivedEMI, pending: Math.max(0, targetEMI - receivedEMI) },
      fixed: { target: targetFixed, received: receivedFixed, pending: Math.max(0, targetFixed - receivedFixed) },
      totalMarketCap,
      activeLoansCount: activeLoans.length,
      totalClients: await Client.countDocuments(),
      overdueAlerts,
      upcomingKists
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};