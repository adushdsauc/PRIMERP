const { EmbedBuilder } = require('discord.js');

const warrantChannels = {
  xbox: '1376269149785034842',
  playstation: '1376268932691787786',
};

function scheduleFineCheck(client, civilian, report, message, platform) {
  setTimeout(async () => {
    if (report.paid) return;

    const updatedEmbed = EmbedBuilder.from(message.embeds[0])
      .setFooter({ text: 'Status: UNPAID' })
      .setColor('Red');

    await message.edit({ embeds: [updatedEmbed], components: [] });

    const warrantEmbed = new EmbedBuilder()
      .setTitle('🚨 Warrant Issued')
      .setDescription(`**${civilian.firstName} ${civilian.lastName}** failed to pay a fine of **$${report.fine}**.`)
      .setColor('Red')
      .setTimestamp();

    const channelId = warrantChannels[platform];
    const channel = await client.channels.fetch(channelId);
    await channel.send({ embeds: [warrantEmbed] });
  }, 1000 * 60 * 60 * 24);
}

module.exports = scheduleFineCheck;
