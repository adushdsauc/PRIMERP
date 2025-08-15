const logError = require('./logError');

async function trackFine(client, { civilianId, reportId, messageId, channelId, platform }) {
  try {
    const Civilian = require('../../models/Civilian');
    const civilian = await Civilian.findById(civilianId);
    if (!civilian) return false;
    console.debug('[trackFine] locating report', reportId, 'for civilian', civilianId);

    const report = civilian.reports.find(r => {
      const id = r.reportId || r._id;
      console.debug('[trackFine] checking report id', id?.toString());
      return id && id.toString() === reportId;
    });
    if (!report) {
      console.warn('[trackFine] report not found. Available reports:', civilian.reports.map(r => r.reportId || r._id));
      return false;
    }
    console.debug('[trackFine] report found', report.reportId || report._id);


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
