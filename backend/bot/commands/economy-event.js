const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const InvestmentAsset = require('../../models/InvestmentAsset');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('economy-event')
    .setDescription('Trigger an economic event affecting a sector')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('category').setDescription('Target category').setRequired(true))
    .addStringOption(opt =>
      opt.setName('direction').setDescription('increase or decrease').setRequired(true).addChoices(
        { name: 'increase', value: 'increase' },
        { name: 'decrease', value: 'decrease' }
      )),
  async execute(interaction) {
    const category = interaction.options.getString('category');
    const direction = interaction.options.getString('direction');
    const modifier = direction === 'increase' ? 0.5 : -0.5;

    const affected = await InvestmentAsset.updateMany(
      { category },
      { eventModifier: modifier }
    );

    if (affected.modifiedCount === 0) {
      return interaction.reply({ content: '❌ No assets found for that category.', ephemeral: true });
    }

    return interaction.reply({ content: `✅ Economic event applied to ${affected.modifiedCount} assets.`, ephemeral: true });
  }
};
