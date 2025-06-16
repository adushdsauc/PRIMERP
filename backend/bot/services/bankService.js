const BankAccount = require('../../models/BankAccount');
const Civilian = require('../../models/Civilian');

async function approveAccount(accountId) {
  const account = await BankAccount.findById(accountId);
  if (!account) throw new Error('Account not found');
  account.needsApproval = false;
  account.status = 'approved';
  return account.save();
}

async function denyAccount(accountId) {
  const account = await BankAccount.findById(accountId);
  if (!account) throw new Error('Account not found');
  await BankAccount.findByIdAndDelete(accountId);
  return account;
}

async function createAccount({ civilianId, accountType, needsApproval = false, reason }) {
  const accountNumber = Math.floor(100000000 + Math.random() * 900000000).toString();
  const status = needsApproval ? 'pending' : 'approved';
  return BankAccount.create({ civilianId, accountType, reason, accountNumber, status, needsApproval, balance: 0 });
}

module.exports = {
  approveAccount,
  denyAccount,
  createAccount,
};
