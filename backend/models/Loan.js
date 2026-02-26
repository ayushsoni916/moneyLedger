const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  type: { type: String, enum: ['EMI', 'FIXED'], required: true },
  principal: { type: Number, required: true },
  totalRepayable: { type: Number, required: true }, 
  interest: { type: Number },
  startDate: { type: Date, default: Date.now },
  dailyKist: { type: Number }, 
  totalDays: { type: Number }, // This is where the NaN error occurred
  dueDate: { type: Date },
  paidAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Settled'], default: 'Active' },
  history: [{
    amount: Number,
    date: { type: Date, default: Date.now },
    paymentType: { type: String, enum: ['Full', 'Partial', 'Advance'], default: 'Partial' },
    note: { type: String }
  }]
}, { timestamps: true });

// FIX: Corrected middleware without the 'next' argument
loanSchema.pre('save', function() {
  if (this.totalRepayable && this.principal) {
    this.interest = this.totalRepayable - this.principal;
  }
});

module.exports = mongoose.model('Loan', loanSchema);