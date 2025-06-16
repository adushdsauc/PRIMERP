const StoreItem = require('../../models/StoreItem');
const Inventory = require('../../models/Inventory');
const { deductFunds, getWallet } = require('./walletService');

async function getItems() {
  return StoreItem.find();
}

async function getItemByName(name) {
  return StoreItem.findOne({ name: new RegExp(`^${name}$`, 'i') });
}

async function addItem(data) {
  return StoreItem.create(data);
}

async function purchaseItem(discordId, item, member) {
  if (typeof item === 'string') {
    item = await getItemByName(item);
  }
  if (!item) {
    throw new Error('Item not found');
  }
  if (item.roleRequirement && member && !member.roles.cache.has(item.roleRequirement)) {
    throw new Error('Missing required role');
  }
  await deductFunds(discordId, item.price);
  await Inventory.findOneAndUpdate(
    { discordId },
    { $push: { items: { name: item.name, price: item.price, purchasedAt: new Date() } } },
    { upsert: true, new: true }
  );
  return item;
}

module.exports = {
  getItems,
  getItemByName,
  addItem,
  purchaseItem,
};
