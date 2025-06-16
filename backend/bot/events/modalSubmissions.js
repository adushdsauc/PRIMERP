const { EmbedBuilder } = require('discord.js');
const BankAccount = require('../../models/BankAccount');
const Civilian = require('../../models/Civilian');

module.exports = async function handleModalSubmissions(interaction) {
  if (!interaction.customId.startsWith('deny_modal_')) return;

  const accountId = interaction.customId.split('deny_modal_')[1];
  const reason = interaction.fields.getTextInputValue('deny_reason');

  const account = await BankAccount.findById(accountId);
  if (!account) return interaction.reply({ content: '❌ Account not found.', ephemeral: true });

  const civilian = await Civilian.findById(account.civilianId);
  if (!civilian) return interaction.reply({ content: '❌ Civilian not found.', ephemeral: true });

  const user = await interaction.client.users.fetch(civilian.discordId);
  const embed = new EmbedBuilder()
    .setTitle('❌ Bank Account Denied')
    .setDescription(`Your **${account.accountType}** account (#${account.accountNumber}) was denied.`)
    .addFields({ name: 'Reason', value: reason })
    .setColor('Red')
    .setTimestamp();

  await user.send({ embeds: [embed] }).catch(err => console.warn('Failed to DM user:', err));
  await BankAccount.findByIdAndDelete(accountId);
  return interaction.reply({ content: '✅ Account denied and user notified.', ephemeral: true });
};
