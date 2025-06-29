const { EmbedBuilder } = require('discord.js');
const logError = require('./logError');

async function sendClockEmbed(client, { officer, discordId, type, duration }) {
  try {
    const user = await client.users.fetch(discordId);
    const platform = officer.department.toLowerCase();
    const logChannelId = platform === 'xbox' ? process.env.LOG_CHANNEL_XBOX : process.env.LOG_CHANNEL_PLAYSTATION;
    const logChannel = await client.channels.fetch(logChannelId).catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle(type === 'in' ? '🟢 Officer Clocked In' : '🔴 Officer Clocked Out')
      .addFields(
        { name: 'Officer', value: `${officer.callsign} (${officer.badgeNumber})`, inline: true },
        { name: 'Status', value: type === 'in' ? 'Clocked In' : `Clocked Out (${duration})`, inline: true }
      )
      .setFooter({ text: type === 'in' ? 'Duty started.' : 'Duty ended.' })
      .setColor(type === 'in' ? 0x00ff00 : 0xff0000)
      .setTimestamp();

    if (user) await user.send({ embeds: [embed] }).catch(err => logError('Send clock embed DM', err));
    if (logChannel) await logChannel.send({ embeds: [embed] });
    return true;
  } catch (err) {
    logError('Send clock embed', err);
    return false;
  }
}

module.exports = sendClockEmbed;
