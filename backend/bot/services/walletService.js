const Wallet = require('../../models/Wallet');

async function getWallet(discordId) {
  let wallet = await Wallet.findOne({ discordId });
  if (!wallet) {
    wallet = await Wallet.create({ discordId });
  }
  return wallet;
}

async function addFunds(discordId, amount) {
  const wallet = await getWallet(discordId);
  wallet.balance += amount;
  await wallet.save();
  return wallet;
}

async function setBalance(discordId, amount) {
  const wallet = await getWallet(discordId);
  wallet.balance = amount;
  await wallet.save();
  return wallet;
}

async function deductFunds(discordId, amount) {
  const wallet = await getWallet(discordId);
  if (wallet.balance < amount) {
    throw new Error('Insufficient funds');
  }
  wallet.balance -= amount;
  await wallet.save();
  return wallet;
}

module.exports = {
  getWallet,
  addFunds,
  setBalance,
  deductFunds,
};
