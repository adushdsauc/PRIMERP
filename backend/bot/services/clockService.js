const ClockSession = require('../../models/ClockSession');

async function clockIn(discordId, officerInfo = {}) {
  const existing = await ClockSession.findOne({ discordId, clockOutTime: null });
  if (existing) {
    throw new Error('Already clocked in');
  }
  return ClockSession.create({
    discordId,
    officerName: officerInfo.officerName || '',
    callsign: officerInfo.callsign || '',
    department: officerInfo.department || '',
    clockInTime: new Date(),
  });
}

async function clockOut(discordId) {
  const session = await ClockSession.findOne({ discordId, clockOutTime: null });
  if (!session) {
    throw new Error('Not clocked in');
  }
  const now = new Date();
  session.clockOutTime = now;
  session.duration = Math.floor((now - session.clockInTime) / 1000);
  await session.save();
  return session;
}

module.exports = {
  clockIn,
  clockOut,
};
