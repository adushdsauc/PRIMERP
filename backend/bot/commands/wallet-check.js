const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, userMention } = require('discord.js');
const Civilian = require('../../models/Civilian');
const Wallet = require('../../models/Wallet');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wallet-check')
    .setDescription("Check another user's wallet balance")
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const discordId = user.id;

    const civilian = await Civilian.findOne({ discordId });
    if (!civilian) {
      return interaction.reply({ content: '❌ User does not have a registered civilian profile.', ephemeral: true });
    }

    const wallet = await Wallet.findOne({ discordId }) || await Wallet.create({ discordId });

    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('💰 Wallet Balance')
      .setDescription(`${userMention(discordId)} has **$${wallet.balance.toFixed(2)}** in cash.`)
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
