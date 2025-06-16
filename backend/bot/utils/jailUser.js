const { EmbedBuilder } = require('discord.js');

const jailRoles = {
  xbox: '1376268599924232202',
  playstation: '1376268687656353914',
};

async function jailUser(client, discordId, jailTime, platform) {
  client.guilds.fetch(process.env[platform.toUpperCase() + '_GUILD_ID']).then(async guild => {
    const member = await guild.members.fetch(discordId);
    const jailRoleId = jailRoles[platform];
    await member.roles.add(jailRoleId);

    const releaseTime = Date.now() + jailTime * 60000;
    const interval = setInterval(async () => {
      const remaining = Math.max(0, releaseTime - Date.now());
      if (remaining <= 0) {
        clearInterval(interval);
        await member.roles.remove(jailRoleId);
        const dmEmbed = new EmbedBuilder()
          .setTitle('🔓 Released from Jail')
          .setDescription(`You have completed your **${jailTime} minute** sentence.`)
          .setColor('Green');
        return member.send({ embeds: [dmEmbed] });
      }
    }, 10000);

    const dmEmbed = new EmbedBuilder()
      .setTitle('⛓️ You Have Been Jailed')
      .setDescription(`You were jailed for **${jailTime} minutes**.`)
      .setFooter({ text: 'You will be released automatically.' })
      .setColor('Orange');

    return member.send({ embeds: [dmEmbed] });
  });
}

module.exports = jailUser;
