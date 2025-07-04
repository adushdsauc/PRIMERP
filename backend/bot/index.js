require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const mongoose = require('mongoose');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessages]
});

client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }
}

const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (!event.name || !event.execute) continue;
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

(async () => {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands });
    console.log('✅ Commands registered.');
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
  }
})();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

client.login(process.env.DISCORD_BOT_TOKEN);

// Utils
const assignLicenseRoleUtil = require('./utils/assignLicenseRole');
const sendBankApprovalEmbedUtil = require('./utils/sendBankApprovalEmbed');
const trackFineUtil = require('./utils/trackFine');
const jailUserUtil = require('./utils/jailUser');
const formatStorePage = require('./utils/formatStorePage');
const scheduleFineCheckUtil = require('./utils/scheduleFineCheck');
const sendClockEmbedUtil = require("./utils/sendClockEmbed");
const sendFinancialLogEmbedUtil = require('./utils/sendFinancialLogEmbed');

module.exports = {
  client,
  assignLicenseRole: (...args) => assignLicenseRoleUtil(client, ...args),
  sendBankApprovalEmbed: (...args) => sendBankApprovalEmbedUtil(client, ...args),
  trackFine: (...args) => trackFineUtil(client, ...args),
  jailUser: (...args) => jailUserUtil(client, ...args),
  formatStorePage,
  scheduleFineCheck: (...args) => scheduleFineCheckUtil(client, ...args),
  sendClockEmbed: (...args) => sendClockEmbedUtil(client, ...args),
  sendFinancialLogEmbed: (...args) => sendFinancialLogEmbedUtil(client, ...args)
};
