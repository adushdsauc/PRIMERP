const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function formatStorePage(items, page = 0, pageSize = 5) {
  const start = page * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  const totalPages = Math.ceil(items.length / pageSize);

  const embed = new EmbedBuilder()
    .setTitle('🛒 Store')
    .setDescription('Buy an item with `/buy` command.\nFor more information on an item use the `/iteminfo` command.')
    .setColor('030303')
    .setTimestamp();

  pageItems.forEach(item => {
    embed.addFields({
      name: `$${Number(item.price).toLocaleString()} – ${item.name}`,
      value: item.description,
      inline: false
    });
  });

  embed.setFooter({ text: `Page ${page + 1}/${totalPages}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`store_prev_${Math.max(page - 1, 0)}`)
      .setLabel('Previous Page')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`store_next_${page + 1}`)
      .setLabel('Next Page')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page + 1 >= totalPages)
  );

  return { embed, row };
}

module.exports = formatStorePage;
