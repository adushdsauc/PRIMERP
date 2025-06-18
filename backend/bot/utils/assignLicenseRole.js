// Map of license types to Discord role IDs.
// Environment variables can override the defaults if needed.
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
    const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
    if (!guild) throw new Error('Guild not found');
    const member = await guild.members.fetch(discordId);
    const roleId = ROLE_MAP[licenseType];
    if (!roleId) throw new Error(`No role ID mapped for ${licenseType}`);
    await member.roles.add(roleId);
    return true;
  } catch (err) {
    logError('Assign license role', err);
    return false;
  }
}

module.exports = assignLicenseRole;
