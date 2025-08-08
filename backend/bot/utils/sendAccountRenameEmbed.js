const logError = require('./logError');

async function sendAccountRenameEmbed(client, embed) {
  try {
    const channel = await client.channels.fetch('1373043842340622436');
    await channel.send({ embeds: [embed] });
    return true;
  } catch (err) {
    logError('Send account rename embed', err);
    return false;
  }
}

module.exports = sendAccountRenameEmbed;
