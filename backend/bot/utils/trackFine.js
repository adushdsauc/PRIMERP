async function trackFine(client, { civilianId, reportId, messageId, channelId, platform }) {
  const Civilian = require('../../models/Civilian');
  const civilian = await Civilian.findById(civilianId);
  if (!civilian) return;

  const report = civilian.reports.find(r => r.reportId?.toString() === reportId);
  if (!report) return;

  const channel = await client.channels.fetch(channelId);
  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (!message) return;

  const scheduleFineCheck = require('./scheduleFineCheck');
  scheduleFineCheck(client, civilian, report, message, platform);
}

module.exports = trackFine;
