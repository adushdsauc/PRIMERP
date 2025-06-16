const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logError = require('./logError');

async function sendBankApprovalEmbed(client, civilianName, discordId, accountType, reason, accountId, accountNumber) {
  try {
    const channel = await client.channels.fetch('1373043842340622436');
    const embed = new EmbedBuilder()
    .setTitle('📝 New Bank Account Request')
    .addFields(
      { name: 'Civilian Name', value: civilianName },
      { name: 'Account Type', value: accountType },
      { name: 'Account Number', value: `#${accountNumber}` },
      { name: 'Reason', value: reason },
      { name: 'Discord User', value: `<@${discordId}>` }
    )
    .setColor('Orange')
    .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`approve_bank_${accountId}`)
      .setLabel('Approve')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`deny_bank_${accountId}`)
      .setLabel('Deny')
      .setStyle(ButtonStyle.Danger)
  );

    await channel.send({ embeds: [embed], components: [row] });
    return true;
  } catch (err) {
    logError('Send bank approval embed', err);
    return false;
  }
}

module.exports = sendBankApprovalEmbed;
