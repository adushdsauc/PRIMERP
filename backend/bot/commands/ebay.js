const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const Inventory = require('../../models/Inventory');
const Auction = require('../../models/Auction');
const closeAuction = require('../utils/closeAuction');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ebay')
    .setDescription('Create an auction for an inventory item')
    .addStringOption(opt => opt.setName('item').setDescription('Item from your inventory').setRequired(true).setAutocomplete(true))
    .addNumberOption(opt => opt.setName('startingbid').setDescription('Starting bid').setRequired(true))
    .addNumberOption(opt => opt.setName('buyout').setDescription('Buyout price').setRequired(true)),
  async execute(interaction) {
    const itemName = interaction.options.getString('item');
    const startingBid = interaction.options.getNumber('startingbid');
    const buyoutPrice = interaction.options.getNumber('buyout');
    const discordId = interaction.user.id;

    const inventory = await Inventory.findOne({ discordId });
    const item = inventory?.items.find(i => i.name.toLowerCase() === itemName.toLowerCase());
    if (!item) {
      return interaction.reply({ content: '❌ Item not found in your inventory.', ephemeral: true });
    }

    if (startingBid <= 0 || buyoutPrice <= 0 || startingBid > buyoutPrice) {
      return interaction.reply({ content: '❌ Invalid starting bid or buyout price.', ephemeral: true });
    }

    const auction = await Auction.create({
      sellerId: discordId,
      itemName: itemName,
      startingBid,
      buyoutPrice,
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 48)
    });

    const embed = new EmbedBuilder()
      .setTitle('🛎️ New Auction')
      .addFields(
        { name: 'Seller', value: `<@${discordId}>`, inline: true },
        { name: 'Item', value: itemName, inline: true },
        { name: 'Starting Bid', value: `$${startingBid}`, inline: true },
        { name: 'Buyout Price', value: `$${buyoutPrice}`, inline: true },
        { name: 'Ends', value: `<t:${Math.floor(auction.endDate.getTime() / 1000)}:R>` }
      )
      .setColor('Yellow')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`bid_${auction._id}`).setLabel('Bid').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`buyout_${auction._id}`).setLabel('Buyout').setStyle(ButtonStyle.Success)
    );

    const threadChannelId = process.env.EBAY_THREAD_CHANNEL;
    const channel = await interaction.client.channels.fetch(threadChannelId);
    const threadOptions = {
      name: `${interaction.user.username} - ${itemName}`,
      autoArchiveDuration: 1440
    };

    let thread;
    let message;
    if (channel.type === ChannelType.GuildForum) {
      threadOptions.message = { embeds: [embed], components: [row] };
      thread = await channel.threads.create(threadOptions);
      message = await thread.fetchStarterMessage();
    } else {
      thread = await channel.threads.create(threadOptions);
      message = await thread.send({ embeds: [embed], components: [row] });
    }

    auction.channelId = thread.id;
    auction.messageId = message.id;
    await auction.save();

    setTimeout(() => closeAuction(interaction.client, auction._id), 1000 * 60 * 60 * 48);

    return interaction.reply({ content: `✅ Auction created: ${thread.toString()}`, ephemeral: true });
  },
  async autocomplete(interaction) {
    const discordId = interaction.user.id;
    const inventory = await Inventory.findOne({ discordId });
    const focused = interaction.options.getFocused();
    const items = inventory?.items.filter(i => i.name.toLowerCase().includes(focused.toLowerCase())).slice(0,25) || [];
    await interaction.respond(items.map(i => ({ name: i.name, value: i.name })));
  }
};
