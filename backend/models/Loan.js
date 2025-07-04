const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  interest: { type: Number, required: true },
  weeklyPayment: { type: Number, required: true },
  termWeeks: { type: Number, required: true },
  paymentsRemaining: { type: Number, required: true },
  creditScoreAtApproval: { type: Number, required: true },
  strikes: { type: Number, default: 0 },
  nextPaymentDue: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'paid', 'defaulted'], default: 'active' }
});

module.exports = mongoose.model('Loan', LoanSchema);
