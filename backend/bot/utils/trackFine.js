const logError = require('./logError');

async function trackFine(client, { civilianId, reportId, messageId, channelId, platform }) {
  try {
    const Civilian = require('../../models/Civilian');
    const civilian = await Civilian.findById(civilianId);
    if (!civilian) return false;

    const report = civilian.reports.find(r => r.reportId?.toString() === reportId);
    if (!report) return false;

    const channel = await client.channels.fetch(channelId);
    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (!message) return false;

    const scheduleFineCheck = require('./scheduleFineCheck');
    scheduleFineCheck(client, civilian, report, message, platform);
    return true;
  } catch (err) {
    logError('Track fine', err);
    return false;
  }
}

module.exports = trackFine;
