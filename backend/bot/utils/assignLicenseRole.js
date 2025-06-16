const ROLE_MAP = {
  "Standard Driver's License": process.env.ROLE_DRIVER,
  "Motorcycle License": process.env.ROLE_MOTORCYCLE,
  "CDL Class A": process.env.ROLE_CDL_A,
  "CDL Class B": process.env.ROLE_CDL_B,
};
const logError = require('./logError');

async function assignLicenseRole(client, discordId, licenseType) {
  try {
    const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
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
