const logError = require('./logError');

async function trackFine(client, { civilianId, reportId, messageId, channelId, platform }) {
  try {
    const Civilian = require('../../models/Civilian');
    const civilian = await Civilian.findOne({
      _id: civilianId,
      'reports.reportId': reportId
    });
    if (!civilian) {
      console.warn('[trackFine] report', reportId, 'not found for civilian', civilianId);
      return false;
    }
    console.debug('[trackFine] locating report', reportId, 'for civilian', civilianId);

    const report = civilian.reports.find(r => r.reportId.toString() === reportId);
    if (!report) {
      console.warn('[trackFine] report', reportId, 'missing in civilian', civilianId);
      return false;
    }
    console.debug('[trackFine] report found', report.reportId);


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
