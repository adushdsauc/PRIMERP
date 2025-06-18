const ROLE_MAP = {
  "Standard Driver's License":
    process.env.ROLE_DRIVER || "1372243631766896680",
  "Motorcycle License":
    process.env.ROLE_MOTORCYCLE || "1372243630613598258",
  "CDL Class A": process.env.ROLE_CDL_A || "1370192296162885672",
  "CDL Class B": process.env.ROLE_CDL_B || "1370192299195236352",
};
const logError = require('./logError');

async function assignLicenseRole(client, discordId, licenseType) {
  try {
    const guildId = process.env.DISCORD_GUILD_ID;
    if (!guildId) throw new Error('DISCORD_GUILD_ID env var not set');

    let guild = client.guilds.cache.get(guildId);
    if (!guild) guild = await client.guilds.fetch(guildId);
    if (!guild) throw new Error('Guild not found');


    if (!guild) throw new Error('Guild not found');
    const member = await guild.members.fetch(discordId);
    if (!member) throw new Error(`Member ${discordId} not found`);

    const roleId = ROLE_MAP[licenseType];
    if (!roleId) throw new Error(`No role ID mapped for ${licenseType}`);

    const role = guild.roles.cache.get(roleId);
    if (!role) throw new Error(`Role ${roleId} not found in guild`);

    await member.roles.add(role);
    return true;
  } catch (err) {
    logError('Assign license role', err);
    return false;
  }
}

module.exports = assignLicenseRole;
