const { EmbedBuilder } = require('discord.js');
const logError = require('./logError');

async function sendFinancialLogEmbed(client, embed) {
  try {
    const channel = await client.channels.fetch('1390491841035763813');
    await channel.send({ embeds: [embed] });
    return true;
  } catch (err) {
    logError('Send financial log embed', err);
    return false;
  }
}

module.exports = sendFinancialLogEmbed;
