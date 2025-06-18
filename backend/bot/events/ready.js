const { Events } = require('discord.js');
const scheduleInvestmentUpdates = require('../utils/updateInvestments');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Bot logged in as ${client.user.tag}`);
    scheduleInvestmentUpdates(client);
  }
};
