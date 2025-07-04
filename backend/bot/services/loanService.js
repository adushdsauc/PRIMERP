const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const CreditProfile = require('../../models/CreditProfile');
const Loan = require('../../models/Loan');
const sendFinancialLogEmbed = require('../utils/sendFinancialLogEmbed');

async function getCredit(discordId) {
  let profile = await CreditProfile.findOne({ discordId });
  if (!profile) profile = await CreditProfile.create({ discordId });
  return profile;
}

async function adjustCredit(client, discordId, delta, reason) {
  const profile = await getCredit(discordId);
  profile.score = Math.max(300, Math.min(850, profile.score + delta));
  await profile.save();

  const embed = new EmbedBuilder()
    .setTitle('💳 Credit Score Updated')
    .setColor(delta >= 0 ? 'Green' : 'Red')
    .setDescription(`<@${discordId}> ${delta >= 0 ? 'gained' : 'lost'} **${Math.abs(delta)}** credit points.`)
    .addFields({ name: 'New Score', value: String(profile.score) }, { name: 'Reason', value: reason })
    .setTimestamp();
  await sendFinancialLogEmbed(client, embed);
  return profile;
}

async function sendPaymentEmbed(client, loan) {
  const user = await client.users.fetch(loan.userId).catch(() => null);
  if (!user) return;
  const embed = new EmbedBuilder()
    .setTitle('💰 Loan Payment Due')
    .setColor('Blue')
    .setDescription(`You owe **$${loan.weeklyPayment}**. Click **Pay** within 24h to avoid penalties.`)
    .addFields(
      { name: 'Payments Left', value: String(loan.paymentsRemaining) },
      { name: 'Next Due', value: `<t:${Math.floor(loan.nextPaymentDue.getTime() / 1000)}:F>` }
    );
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`loan_pay_${loan._id}`).setLabel('Pay').setStyle(ButtonStyle.Success)
  );
  await user.send({ embeds: [embed], components: [row] }).catch(() => null);
}

async function createLoan(client, discordId, amount, termWeeks, interest, type = 'Personal') {
  const total = amount * (1 + interest / 100);
  const weeklyPayment = Number((total / termWeeks).toFixed(2));
  const profile = await getCredit(discordId);
  const loan = await Loan.create({
    userId: discordId,
    amount,
    interest,
    weeklyPayment,
    termWeeks,
    paymentsRemaining: termWeeks,
    creditScoreAtApproval: profile.score,
    type,
    nextPaymentDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await adjustCredit(client, discordId, 15, 'Loan approved');
  schedulePayment(client, loan);

  const user = await client.users.fetch(discordId).catch(() => null);
  if (user) {
    const dm = new EmbedBuilder()
      .setTitle('✅ Loan Started')
      .setColor('Green')
      .setDescription(`Your ${type} loan for **$${amount}** has been activated.`)
      .addFields({ name: 'Next Payment', value: `<t:${Math.floor(loan.nextPaymentDue.getTime() / 1000)}:F>` });
    await user.send({ embeds: [dm] }).catch(() => null);
    await sendPaymentEmbed(client, loan);
  }

  const embed = new EmbedBuilder()
    .setTitle('✅ Loan Signed')
    .setColor('Green')
    .addFields(
      { name: 'User', value: `<@${discordId}>`, inline: true },
      { name: 'Amount', value: `$${amount}` , inline: true },
      { name: 'Term', value: `${termWeeks} weeks`, inline: true },
      { name: 'Interest', value: `${interest}%`, inline: true }
    )
    .setTimestamp();
  await sendFinancialLogEmbed(client, embed);
  return loan;
}

async function payLoan(client, loanId) {
  const loan = await Loan.findById(loanId);
  if (!loan || loan.status !== 'active') return null;
  loan.paymentsRemaining -= 1;
  loan.nextPaymentDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await adjustCredit(client, loan.userId, 10, 'Loan payment received');
  if (loan.paymentsRemaining <= 0) {
    loan.status = 'paid';
    await adjustCredit(client, loan.userId, 30, 'Loan fully repaid');
  }
  await loan.save();
  if (loan.status === 'active') schedulePayment(client, loan);
  const user = await client.users.fetch(loan.userId).catch(() => null);
  if (user) {
    const dm = new EmbedBuilder()
      .setTitle('✅ Payment Received')
      .setColor('Green')
      .setDescription(`We received your payment of **$${loan.weeklyPayment}**.`)
      .addFields({ name: 'Next Due', value: `<t:${Math.floor(loan.nextPaymentDue.getTime() / 1000)}:F>` });
    await user.send({ embeds: [dm] }).catch(() => null);
  }
  const logEmbed = new EmbedBuilder()
    .setTitle('💸 Loan Payment')
    .setColor('Blue')
    .addFields(
      { name: 'User', value: `<@${loan.userId}>`, inline: true },
      { name: 'Amount', value: `$${loan.weeklyPayment}`, inline: true },
      { name: 'Loan ID', value: loan._id.toString(), inline: true }
    )
    .setTimestamp();
  await sendFinancialLogEmbed(client, logEmbed);
  if (loan.status === 'paid') {
    const finish = new EmbedBuilder()
      .setTitle('🏁 Loan Paid Off')
      .setColor('Green')
      .setDescription(`Loan **${loan._id.toString()}** has been fully repaid.`)
      .setTimestamp();
    if (user) await user.send({ embeds: [finish] }).catch(() => null);
    await sendFinancialLogEmbed(client, finish);
  }
  return loan;
}

async function markMissedPayment(client, loan) {
  loan.strikes += 1;
  await adjustCredit(client, loan.userId, -25, 'Missed loan payment');
  if (loan.strikes >= 3) {
    loan.status = 'defaulted';
  }
  await loan.save();
  if (loan.status === 'active') {
    loan.nextPaymentDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    schedulePayment(client, loan);
  }
}

function schedulePayment(client, loan) {
  const delay = loan.nextPaymentDue.getTime() - Date.now();
  setTimeout(async () => {
    const fresh = await Loan.findById(loan._id);
    if (!fresh || fresh.status !== 'active') return;
    await sendPaymentEmbed(client, fresh);

    setTimeout(async () => {
      const check = await Loan.findById(fresh._id);
      if (!check || check.status !== 'active') return;
      if (check.nextPaymentDue > Date.now() - 6.5 * 24 * 60 * 60 * 1000) return; // payment made
      if (check.paymentsRemaining === fresh.paymentsRemaining) {
        await markMissedPayment(client, check);
      }
    }, 24 * 60 * 60 * 1000);
  }, Math.max(0, delay));
}

module.exports = {
  getCredit,
  adjustCredit,
  createLoan,
  payLoan,
  schedulePayment,
  sendPaymentEmbed,
};
