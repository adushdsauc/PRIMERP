const { EmbedBuilder } = require('discord.js');

function sendDM(member, embed) {
  return member.send({ embeds: [embed] }).catch(err => console.warn("Failed to DM member:", err));
}

function scheduleFineCheck(client, warrantChannels, civilian, report, message, platform) {
  setTimeout(async () => {
    if (report.paid) return;

    const updatedEmbed = EmbedBuilder.from(message.embeds[0])
      .setFooter({ text: `Status: UNPAID` })
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
  }, 1000 * 60 * 60 * 24); // 24 hours
}

const jailRoles = {
  xbox: '1376268599924232202',
  playstation: '1376268687656353914'
};

function jailUser(client, discordId, jailTime, platform) {
  client.guilds.fetch(process.env[platform.toUpperCase() + '_GUILD_ID']).then(async guild => {
    const member = await guild.members.fetch(discordId);
    const jailRoleId = jailRoles[platform];
    await member.roles.add(jailRoleId);

    const releaseTime = Date.now() + jailTime * 60000;
    const interval = setInterval(async () => {
      if (Date.now() >= releaseTime) {
        clearInterval(interval);
        await member.roles.remove(jailRoleId);
        const releaseEmbed = new EmbedBuilder()
          .setTitle('🔓 Released from Jail')
          .setDescription(`You have completed your **${jailTime} minute** sentence.`)
          .setColor('Green');
        await sendDM(member, releaseEmbed);
      }
    }, 10000);

    const jailEmbed = new EmbedBuilder()
      .setTitle('⛓️ You Have Been Jailed')
      .setDescription(`You were jailed for **${jailTime} minutes**.`)
      .setFooter({ text: 'You will be released automatically.' })
      .setColor('Orange');

    await sendDM(member, jailEmbed);
  });
}

module.exports = {
  sendDM,
  scheduleFineCheck,
  jailUser
};
