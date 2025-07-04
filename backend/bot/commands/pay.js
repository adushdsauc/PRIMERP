const { SlashCommandBuilder, userMention, EmbedBuilder } = require('discord.js');
const sendFinancialLogEmbed = require('../utils/sendFinancialLogEmbed');
const Wallet = require('../../models/Wallet');
const Civilian = require('../../models/Civilian');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Transfer cash to another player')
    .addUserOption(opt =>
      opt.setName('user').setDescription('Recipient').setRequired(true)
    )
    .addNumberOption(opt =>
      opt.setName('amount').setDescription('Amount to send').setRequired(true)
    ),
  async execute(interaction) {
    const recipient = interaction.options.getUser('user');
    const amount = interaction.options.getNumber('amount');
    const senderId = interaction.user.id;

    if (amount <= 0) {
      return interaction.reply({ content: '❌ Amount must be greater than 0.', ephemeral: true });
    }
    if (recipient.bot || recipient.id === senderId) {
      return interaction.reply({ content: '❌ Invalid recipient.', ephemeral: true });
    }

    const [senderCivilian, recipientCivilian] = await Promise.all([
      Civilian.findOne({ discordId: senderId }),
      Civilian.findOne({ discordId: recipient.id })
    ]);
    if (!senderCivilian || !recipientCivilian) {
      return interaction.reply({ content: '❌ Both users must have a registered civilian profile.', ephemeral: true });
    }

    const senderWallet = await Wallet.findOne({ discordId: senderId }) || await Wallet.create({ discordId: senderId });
    if (senderWallet.balance < amount) {
      return interaction.reply({ content: '❌ Insufficient funds.', ephemeral: true });
    }
    const recipientWallet = await Wallet.findOne({ discordId: recipient.id }) || await Wallet.create({ discordId: recipient.id });

    senderWallet.balance -= amount;
    recipientWallet.balance += amount;
    await Promise.all([senderWallet.save(), recipientWallet.save()]);

    const embed = new EmbedBuilder()
      .setTitle('💸 Wallet Transfer')
      .setColor('Blue')
      .addFields(
        { name: 'From', value: userMention(senderId), inline: true },
        { name: 'To', value: userMention(recipient.id), inline: true },
        { name: 'Amount', value: `$${amount}`, inline: true }
      )
      .setTimestamp();
    await sendFinancialLogEmbed(interaction.client, embed);

    return interaction.reply({ content: `✅ Transferred $${amount} to ${userMention(recipient.id)}.`, ephemeral: true });
  }
};
