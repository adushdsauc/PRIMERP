const { EmbedBuilder } = require('discord.js');
const logError = require('./logError');

// IDs for the Discord server and channel where unpaid fine alerts should be sent
const GUILD_ID = '1377040243735400550';
const WARRANT_CHANNEL_ID = '1406032481198538843';

function scheduleFineCheck(client, civilian, report, message, platform) {
  setTimeout(async () => {
    try {
      if (report.paid) return;

      const updatedEmbed = EmbedBuilder.from(message.embeds[0])
        .setFooter({ text: 'Status: UNPAID' })
        .setColor('Red');

      await message.edit({ embeds: [updatedEmbed], components: [] });

      const user = await client.users.fetch(civilian.discordId).catch(() => null);

      const warrantEmbed = new EmbedBuilder()
        .setTitle('🚨 Unpaid Fine')
        .setColor('Red')
        .addFields(
          { name: 'Civilian Name', value: `${civilian.firstName} ${civilian.lastName}`, inline: true },
          { name: 'Discord User', value: user ? `${user.tag} (<@${user.id}>)` : `<@${civilian.discordId}>`, inline: true },
          { name: 'Issuing Officer', value: report.officerName || 'Unknown', inline: true },
          { name: 'Fine Amount', value: `$${report.fine}`, inline: true },
          { name: 'Charges', value: report.offense || 'N/A', inline: false },
          { name: 'Platform', value: platform, inline: true },
        )
        .setTimestamp();

      const guild = await client.guilds.fetch(GUILD_ID);
      const channel = await guild.channels.fetch(WARRANT_CHANNEL_ID);
      await channel.send({ embeds: [warrantEmbed] });
    } catch (err) {
      logError('Schedule fine check', err);
    }
  }, 1000 * 60 * 60 * 24);
}

module.exports = scheduleFineCheck;
