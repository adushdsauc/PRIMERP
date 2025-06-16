const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, userMention } = require('discord.js');
const Civilian = require('../../models/Civilian');
const Wallet = require('../../models/Wallet');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wallet')
    .setDescription('Manage civilian wallet balances')
    .addSubcommand(sub =>
      sub.setName('check')
        .setDescription('Check wallet balance')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add wallet funds')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addNumberOption(opt => opt.setName('amount').setDescription('Amount to add').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Set wallet balance')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addNumberOption(opt => opt.setName('amount').setDescription('New balance').setRequired(true))
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user');
    const discordId = user.id;

    let civilian;
    try {
      civilian = await Civilian.findOne({ discordId });
      if (!civilian || !civilian.discordId) throw new Error('Civilian not found or missing Discord ID.');
    } catch (err) {
      console.error('❌ Wallet command error:', err.message);
      return interaction.reply({ content: '❌ User does not have a registered civilian profile. Please create one before using this command.', ephemeral: true });
    }

    const wallet = await Wallet.findOne({ discordId }) || await Wallet.create({ discordId });
    const embed = new EmbedBuilder().setColor('Red').setTimestamp();

    if (sub === 'check') {
      embed.setTitle('💰 Wallet Balance').setDescription(`${userMention(user.id)} has **$${wallet.balance.toFixed(2)}** in cash.`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'add' || sub === 'set') {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
      }

      const amount = interaction.options.getNumber('amount');

      if (sub === 'add') {
        wallet.balance += amount;
        await wallet.save();
        embed.setTitle('✅ Wallet Updated')
          .setDescription(`Added $${amount.toFixed(2)} to ${userMention(user.id)}'s wallet.`)
          .addFields({ name: 'New Balance', value: `$${wallet.balance.toFixed(2)}` });
      }

      if (sub === 'set') {
        wallet.balance = amount;
        await wallet.save();
        embed.setTitle('✏️ Wallet Set')
          .setDescription(`Wallet for ${userMention(user.id)} set to:`)
          .addFields({ name: 'Balance', value: `$${amount.toFixed(2)}` });
      }

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
