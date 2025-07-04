const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sendFinancialLogEmbed = require('../utils/sendFinancialLogEmbed');

const StoreItem = require('../../models/StoreItem');
const Civilian = require('../../models/Civilian');
const Wallet = require('../../models/Wallet');
const Inventory = require('../../models/Inventory');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Purchase an item from the store')
    .addStringOption(opt =>
      opt.setName('name').setDescription('Name of the item to purchase').setRequired(true).setAutocomplete(true)
    ),
  async execute(interaction) {
    const name = interaction.options.getString('name');
    const item = await StoreItem.findOne({ name: new RegExp(`^${name}$`, 'i') });

    if (!item) {
      return interaction.reply({ content: `❌ No item named "${name}" found in the store.`, ephemeral: true });
    }

    const user = interaction.user;
    const discordId = user.id;

    const civilian = await Civilian.findOne({ discordId });
    if (!civilian) {
      return interaction.reply({ content: "❌ You don't have a registered civilian profile.", ephemeral: true });
    }

    const wallet = await Wallet.findOne({ discordId });
    if (!wallet || wallet.balance < item.price) {
      return interaction.reply({ content: `❌ You don't have enough funds. You need $${item.price.toFixed(2)}.`, ephemeral: true });
    }

    if (item.roleRequirement) {
      const member = await interaction.guild.members.fetch(discordId);
      if (!member.roles.cache.has(item.roleRequirement)) {
        return interaction.reply({ content: `❌ You need the <@&${item.roleRequirement}> role to buy this item.`, ephemeral: true });
      }
    }

    wallet.balance -= item.price;
    await wallet.save();

    await Inventory.findOneAndUpdate(
      { discordId },
      { $push: { items: { name: item.name, price: item.price, purchasedAt: new Date() } } },
      { upsert: true, new: true }
    );

    const logEmbed = new EmbedBuilder()
      .setTitle('🛒 Item Purchased')
      .setColor('Green')
      .addFields(
        { name: 'User', value: interaction.user.tag, inline: true },
        { name: 'Item', value: item.name, inline: true },
        { name: 'Price', value: `$${item.price.toFixed(2)}`, inline: true }
      )
      .setTimestamp();
    await sendFinancialLogEmbed(interaction.client, logEmbed);


    const embed = new EmbedBuilder()
      .setTitle('🛒 Purchase Successful')
      .setDescription(`You bought **${item.name}** for **$${item.price.toFixed(2)}**.`)
      .setColor('Green')
      .setTimestamp();

    if (item.image) embed.setImage(item.image);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const items = await StoreItem.find({ name: { $regex: focused, $options: 'i' } }).limit(25);
    await interaction.respond(items.map(i => ({ name: i.name, value: i.name })));
  }
};
