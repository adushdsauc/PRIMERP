require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  SlashCommandBuilder,
  REST,
  Routes,
  PermissionsBitField,
  userMention
} = require("discord.js");
const mongoose = require("mongoose");
const BankAccount = require("./models/BankAccount");
const Civilian = require("./models/Civilian");
const Wallet = require("./models/Wallet");
const StoreItem = require("./models/StoreItem"); // <-- Add this line
const { v4: uuidv4 } = require("uuid"); // for generating unique report IDs if needed
const ClockSession = require("./models/ClockSession");
const Officer = require("./models/Officer");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
});

const jailRoles = {
  xbox: "1376268599924232202",
  playstation: "1376268687656353914",
};

const warrantChannels = {
  xbox: "1376269149785034842",
  playstation: "1376268932691787786",
};

function formatStorePage(items, page = 1, perPage = 5) {
  const totalPages = Math.ceil(items.length / perPage);
  const start = (page - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);

  const embed = new EmbedBuilder()
    .setTitle("Store")
    .setDescription("Buy an item with `/buy`\nView details with `/iteminfo`")
    .setColor("Blue")
    .setFooter({ text: `Page ${page}/${totalPages}` })
    .setTimestamp();

  pageItems.forEach(item => {
    embed.addFields({
      name: `$${item.price.toLocaleString()} – ${item.name}`,
      value: item.description || "No description provided."
    });
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`store_prev_${page - 1}`)
      .setLabel("Previous Page")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(`store_next_${page + 1}`)
      .setLabel("Next Page")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page >= totalPages)
  );

  return { embed, row };
}

client.once(Events.ClientReady, () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    const customId = interaction.customId;

    if (customId === "clock_in" || customId === "clock_out") {
      const discordId = interaction.user.id;
      const officer = await Officer.findOne({ discordId });
      if (!officer) {
        return interaction.reply({ content: "❌ Officer not registered.", ephemeral: true });
      }
    
      const now = new Date();
      const platform = officer.department.toLowerCase(); // xbox or playstation
      const logChannelId = platform === "xbox" ? "1376268599924232202" : "1376268687656353914"; // use your platform-specific log channel IDs
      const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
    
      const dmEmbed = new EmbedBuilder()
        .setColor(customId === "clock_in" ? "Green" : "Red")
        .setTitle(customId === "clock_in" ? "🟢 You are now clocked in." : "🔴 You are now clocked out.")
        .setDescription(`Officer **${officer.callsign}** has ${customId === "clock_in" ? "clocked in" : "clocked out"}.`)
        .setFooter({ text: dayjs().format("MMMM D, YYYY • h:mm A") });
    
      const logEmbed = EmbedBuilder.from(dmEmbed)
        .setTitle(`${customId === "clock_in" ? "🟢 Clock In Log" : "🔴 Clock Out Log"}`)
        .addFields(
          { name: "Name", value: officer.callsign, inline: true },
          { name: "Badge #", value: String(officer.badgeNumber), inline: true },
          { name: "Platform", value: officer.department, inline: true }
        );
    
      if (customId === "clock_in") {
        const active = await ClockSession.findOne({ discordId, clockOutTime: null });
        if (active) return interaction.reply({ content: "❌ You are already clocked in.", ephemeral: true });
    
        await ClockSession.create({ discordId, clockInTime: now });
    
        await interaction.user.send({ embeds: [dmEmbed] }).catch(() => null);
        if (logChannel) await logChannel.send({ embeds: [logEmbed] });
    
        return interaction.reply({ content: "✅ You are clocked in.", ephemeral: true });
      }
    
      if (customId === "clock_out") {
        const session = await ClockSession.findOne({ discordId, clockOutTime: null });
        if (!session) return interaction.reply({ content: "❌ You were not clocked in.", ephemeral: true });
    
        session.clockOutTime = now;
        await session.save();
    
        const durationMs = now - session.clockInTime;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
        dmEmbed.setDescription(`Officer **${officer.callsign}** clocked out.\nTotal time: **${hours}h ${minutes}m**`);
        logEmbed.setDescription(`Officer **${officer.callsign}** clocked out.\nTotal time: **${hours}h ${minutes}m**`);
    
        await interaction.user.send({ embeds: [dmEmbed] }).catch(() => null);
        if (logChannel) await logChannel.send({ embeds: [logEmbed] });
    
        return interaction.reply({ content: "✅ You are clocked out.", ephemeral: true });
      }
    }    

    if (customId.startsWith("approve_bank_")) {
      const accountId = customId.split("approve_bank_")[1];
      const account = await BankAccount.findById(accountId);
      if (!account) return interaction.reply({ content: "❌ Account not found.", ephemeral: true });

      account.needsApproval = false;
      account.status = "approved";
      await account.save();

      const civilian = await Civilian.findById(account.civilianId);
      if (!civilian) return interaction.reply({ content: "❌ Civilian not found.", ephemeral: true });

      const user = await client.users.fetch(civilian.discordId);
      const embed = new EmbedBuilder()
        .setTitle("✅ Bank Account Approved")
        .setDescription(`Your **${account.accountType}** account (#${account.accountNumber}) has been approved.`)
        .setColor("Green")
        .setTimestamp();

      await user.send({ embeds: [embed] });
      return interaction.reply({ content: "✅ Approved and user notified.", ephemeral: true });
    }

    if (customId.startsWith("pay_fine_")) {
      const reportId = customId.split("pay_fine_")[1];
      const discordId = interaction.user.id;
  
      const civilian = await Civilian.findOne({ discordId });
      if (!civilian) return interaction.reply({ content: "❌ Civilian not found.", ephemeral: true });
  
      const report = civilian.reports.find(r => r.reportId?.toString() === reportId);
      if (!report) return interaction.reply({ content: "❌ Report not found.", ephemeral: true });
      if (report.paid) return interaction.reply({ content: "✅ Fine already paid.", ephemeral: true });
  
      const wallet = await Wallet.findOne({ discordId });
      if (!wallet || wallet.balance < report.fine) {
        return interaction.reply({ content: `❌ Not enough funds. You need $${report.fine}.`, ephemeral: true });
      }
  
      wallet.balance -= report.fine;
      report.paid = true;
      await wallet.save();
      await civilian.save();
  
      const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setFooter({ text: `Status: PAID` })
        .setColor("Green");
  
      await interaction.update({ embeds: [updatedEmbed], components: [] });
    }
  

    if (customId.startsWith("deny_bank_")) {
      const accountId = customId.split("deny_bank_")[1];
      const modal = new ModalBuilder()
        .setCustomId(`deny_modal_${accountId}`)
        .setTitle("Deny Bank Account")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("deny_reason")
              .setLabel("Reason for Denial")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          )
        );
      return interaction.showModal(modal);
    }
  }
if (interaction.isButton()) {
  const customId = interaction.customId;

  if (customId.startsWith("store_prev_") || customId.startsWith("store_next_")) {
    const items = await StoreItem.find();
    const [, , rawPage] = customId.split("_");
    const page = parseInt(rawPage);

    const { embed, row } = formatStorePage(items, page);
    return interaction.update({ embeds: [embed], components: [row] });
  }
}

}
  
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId.startsWith("deny_modal_")) {
    const accountId = interaction.customId.split("deny_modal_")[1];
    const reason = interaction.fields.getTextInputValue("deny_reason");

    const account = await BankAccount.findById(accountId);
    if (!account) return interaction.reply({ content: "❌ Account not found.", ephemeral: true });

    const civilian = await Civilian.findById(account.civilianId);
    if (!civilian) return interaction.reply({ content: "❌ Civilian not found.", ephemeral: true });

    const user = await client.users.fetch(civilian.discordId);
    const embed = new EmbedBuilder()
      .setTitle("❌ Bank Account Denied")
      .setDescription(`Your **${account.accountType}** account (#${account.accountNumber}) was denied.`)
      .addFields({ name: "Reason", value: reason })
      .setColor("Red")
      .setTimestamp();

    await user.send({ embeds: [embed] });
    await BankAccount.findByIdAndDelete(accountId);
    return interaction.reply({ content: "✅ Account denied and user notified.", ephemeral: true });
  }

  if (!interaction.isChatInputCommand()) return;
  if (!["wallet", "additem", "store", "iteminfo", "buy", "inventory"].includes(interaction.commandName)) return;
  if (interaction.commandName === "inventory") {
    const items = await StoreItem.find({ buyers: interaction.user.id });
  
    if (items.length === 0) {
      return interaction.reply({ content: "🪹 Your inventory is empty.", ephemeral: true });
    }
  
    const embed = new EmbedBuilder()
      .setTitle("📦 Your Inventory")
      .setDescription("Here are the items you've purchased:")
      .setColor("Blue")
      .setTimestamp();
  
    items.forEach(item => {
      embed.addFields({
        name: item.name,
        value: `**Price:** $${item.price.toFixed(2)}\n**Description:** ${item.description}`,
      });
    });
  
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  if (interaction.commandName === "buy") {
    const name = interaction.options.getString("name");
    const item = await StoreItem.findOne({ name: new RegExp(`^${name}$`, "i") });
  
    if (!item) {
      return interaction.reply({ content: `❌ No item named "${name}" found in the store.`, ephemeral: true });
    }
  
    const user = interaction.user;
    const discordId = user.id;
  
    const civilian = await Civilian.findOne({ discordId });
    if (!civilian) {
      return interaction.reply({ content: "❌ You don't have a registered civilian profile.", ephemeral: true });
    }
  
    const wallet = await Wallet.findOne({ discordId });
    if (!wallet || wallet.balance < item.price) {
      return interaction.reply({ content: `❌ You don't have enough funds. You need $${item.price.toFixed(2)}.`, ephemeral: true });
    }
  
    if (item.roleRequirement) {
      const member = await interaction.guild.members.fetch(discordId);
      if (!member.roles.cache.has(item.roleRequirement)) {
        return interaction.reply({ content: `❌ You need the <@&${item.roleRequirement}> role to buy this item.`, ephemeral: true });
      }
    }
  
    wallet.balance -= item.price;
    await wallet.save();
  
    // You can log this purchase somewhere or extend with an Inventory system later
    const embed = new EmbedBuilder()
      .setTitle("🛒 Purchase Successful")
      .setDescription(`You bought **${item.name}** for **$${item.price.toFixed(2)}**.`)
      .setColor("Green")
      .setTimestamp();
  
    if (item.image) embed.setImage(item.image);
  
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  if (interaction.commandName === "iteminfo") {
    const name = interaction.options.getString("name");
    const item = await StoreItem.findOne({ name: new RegExp(`^${name}$`, "i") });
  
    if (!item) {
      return interaction.reply({ content: `❌ No item named "${name}" found in the store.`, ephemeral: true });
    }
  
    const embed = new EmbedBuilder()
      .setTitle(`🧾 Info: ${item.name}`)
      .setDescription(item.description)
      .addFields(
        { name: "Price", value: `$${item.price.toFixed(2)}`, inline: true },
        { name: "Role Required", value: item.roleRequirement ? `<@&${item.roleRequirement}>` : "None", inline: true }
      )
      .setColor("Purple")
      .setTimestamp();
  
    if (item.image) {
      embed.setImage(item.image);
    }
  
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
if (interaction.commandName === "store") {
  const items = await StoreItem.find();

  if (items.length === 0) {
    return interaction.reply({
      content: "🛒 The store is currently empty.",
      ephemeral: true,
    });
  }

  const { embed, row } = formatStorePage(items, 1);
  return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}
  });
    const name = interaction.options.getString("name");
    const description = interaction.options.getString("description");
    const price = interaction.options.getNumber("price");
    const image = interaction.options.getString("image");
    const role = interaction.options.getRole("role");
  
    const newItem = await StoreItem.create({
      name,
      description,
      price,
      image,
      roleRequirement: role ? role.id : null,
    });
  
    const itemembed = new EmbedBuilder()
      .setTitle("🛒 New Store Item Added")
      .addFields(
        { name: "Name", value: name, inline: true },
        { name: "Price", value: `$${price}`, inline: true },
        { name: "Description", value: description }
      )
      .setColor("Green")
      .setTimestamp();
  
    if (image) embed.setImage(image);
    if (role) embed.addFields({ name: "Role Requirement", value: `<@&${role.id}>` });
  
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: "❌ Admins only.", ephemeral: true });
  }

  const sub = interaction.options.getSubcommand();
  const user = interaction.options.getUser("user");
  const discordId = user.id;

  let civilian;
  try {
    civilian = await Civilian.findOne({ discordId });
    if (!civilian || !civilian.discordId) throw new Error("Civilian not found or missing Discord ID.");
  } catch (err) {
    console.error("❌ Wallet command error:", err.message);
    return interaction.reply({
      content: "❌ User does not have a registered civilian profile. Please create one before using this command.",
      ephemeral: true,
    });
  }

  const wallet = await Wallet.findOne({ discordId }) || await Wallet.create({ discordId });

  const embed = new EmbedBuilder().setColor("Red").setTimestamp();

  if (sub === "check") {
    embed
      .setTitle("💰 Wallet Balance")
      .setDescription(`${userMention(user.id)} has **$${wallet.balance.toFixed(2)}** in cash.`);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (sub === "add") {
    const amount = interaction.options.getNumber("amount");
    wallet.balance += amount;
    await wallet.save();
    embed
      .setTitle("✅ Wallet Updated")
      .setDescription(`Added $${amount.toFixed(2)} to ${userMention(user.id)}'s wallet.`)
      .addFields({ name: "New Balance", value: `$${wallet.balance.toFixed(2)}` });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (sub === "set") {
    const amount = interaction.options.getNumber("amount");
    wallet.balance = amount;
    await wallet.save();
    embed
      .setTitle("✏️ Wallet Set")
      .setDescription(`Wallet for ${userMention(user.id)} set to:`)
      .addFields({ name: "Balance", value: `$${amount.toFixed(2)}` });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

const ROLE_MAP = {
  "Standard Driver's License": process.env.ROLE_DRIVER,
  "Motorcycle License": process.env.ROLE_MOTORCYCLE,
  "CDL Class A": process.env.ROLE_CDL_A,
  "CDL Class B": process.env.ROLE_CDL_B,
};

async function assignLicenseRole(discordId, licenseType) {
  const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
  const member = await guild.members.fetch(discordId);
  const roleId = ROLE_MAP[licenseType];
  if (!roleId) throw new Error(`No role ID mapped for ${licenseType}`);
  await member.roles.add(roleId);
}

async function sendBankApprovalEmbed(civilianName, discordId, accountType, reason, accountId, accountNumber) {
  const channel = await client.channels.fetch("1373043842340622436");
  const embed = new EmbedBuilder()
    .setTitle("📝 New Bank Account Request")
    .addFields(
      { name: "Civilian Name", value: civilianName },
      { name: "Account Type", value: accountType },
      { name: "Account Number", value: `#${accountNumber}` },
      { name: "Reason", value: reason },
      { name: "Discord User", value: `<@${discordId}>` }
    )
    .setColor("Orange")
    .setTimestamp();

    

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`approve_bank_${accountId}`)
      .setLabel("Approve")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`deny_bank_${accountId}`)
      .setLabel("Deny")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({ embeds: [embed], components: [row] });
}

(async () => {
  const commands = [
    new SlashCommandBuilder()
      .setName("wallet")
      .setDescription("Manage civilian wallet balances")
      .addSubcommand(sub =>
        sub.setName("check")
          .setDescription("Check wallet balance")
          .addUserOption(opt =>
            opt.setName("user").setDescription("Target user").setRequired(true))
      )
      .addSubcommand(sub =>
        sub.setName("add")
          .setDescription("Add wallet funds")
          .addUserOption(opt =>
            opt.setName("user").setDescription("Target user").setRequired(true))
          .addNumberOption(opt =>
            opt.setName("amount").setDescription("Amount to add").setRequired(true))
      )
      .addSubcommand(sub =>
        sub.setName("set")
          .setDescription("Set wallet balance")
          .addUserOption(opt =>
            opt.setName("user").setDescription("Target user").setRequired(true))
          .addNumberOption(opt =>
            opt.setName("amount").setDescription("New balance").setRequired(true))
      ),
      new SlashCommandBuilder()
  .setName("additem")
  .setDescription("Add a new item to the store")
  .addStringOption(opt =>
    opt.setName("name").setDescription("Item name").setRequired(true))
  .addStringOption(opt =>
    opt.setName("description").setDescription("Item description").setRequired(true))
  .addNumberOption(opt =>
    opt.setName("price").setDescription("Item price").setRequired(true))
  .addStringOption(opt =>
    opt.setName("image").setDescription("Image URL (optional)").setRequired(false))
  .addRoleOption(opt =>
    opt.setName("role").setDescription("Role requirement (optional)").setRequired(false)),

    new SlashCommandBuilder()
  .setName("store")
  .setDescription("View the available items in the store"),

  new SlashCommandBuilder()
  .setName("iteminfo")
  .setDescription("Get detailed information about a store item")
  .addStringOption(opt =>
    opt.setName("name")
      .setDescription("Name of the item")
      .setRequired(true)
  ),
  new SlashCommandBuilder()
  .setName("buy")
  .setDescription("Purchase an item from the store")
  .addStringOption(opt =>
    opt.setName("name")
      .setDescription("Name of the item to purchase")
      .setRequired(true)
  ),
new SlashCommandBuilder()
  .setName("inventory")
  .setDescription("View your purchased store items")

  ];
  

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);
  try {
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands.map(cmd => cmd.toJSON()) }
    );
    console.log("✅ Wallet commands registered.");
  } catch (err) {
    console.error("❌ Failed to register wallet commands:", err);
  }
})();

function scheduleFineCheck(civilian, report, message, platform) {
  setTimeout(async () => {
    if (report.paid) return;

    const updatedEmbed = EmbedBuilder.from(message.embeds[0])
      .setFooter({ text: `Status: UNPAID` })
      .setColor("Red");

    await message.edit({ embeds: [updatedEmbed], components: [] });

    const warrantEmbed = new EmbedBuilder()
      .setTitle("🚨 Warrant Issued")
      .setDescription(`**${civilian.firstName} ${civilian.lastName}** failed to pay a fine of **$${report.fine}**.`)
      .setColor("Red")
      .setTimestamp();

    const channelId = warrantChannels[platform];
    const channel = await client.channels.fetch(channelId);
    await channel.send({ embeds: [warrantEmbed] });
  }, 1000 * 60 * 60 * 24); // 24 hours
}

function jailUser(discordId, jailTime, platform) {
  client.guilds.fetch(process.env[platform.toUpperCase() + "_GUILD_ID"]).then(async guild => {
    const member = await guild.members.fetch(discordId);
    const jailRoleId = jailRoles[platform];
    await member.roles.add(jailRoleId);

    const releaseTime = Date.now() + jailTime * 60000;
    const interval = setInterval(async () => {
      const remaining = Math.max(0, releaseTime - Date.now());
      if (remaining <= 0) {
        clearInterval(interval);
        await member.roles.remove(jailRoleId);
        const dmEmbed = new EmbedBuilder()
          .setTitle("🔓 Released from Jail")
          .setDescription(`You have completed your **${jailTime} minute** sentence.`)
          .setColor("Green");
        return member.send({ embeds: [dmEmbed] });
      }
    }, 10000);

    const dmEmbed = new EmbedBuilder()
      .setTitle("⛓️ You Have Been Jailed")
      .setDescription(`You were jailed for **${jailTime} minutes**.`)
      .setFooter({ text: "You will be released automatically." })
      .setColor("Orange");

    await member.send({ embeds: [dmEmbed] });
  });
}
function scheduleFineCheck(civilian, report, message, platform) {
  setTimeout(async () => {
    if (report.paid) return;

    const updatedEmbed = EmbedBuilder.from(message.embeds[0])
      .setFooter({ text: `Status: UNPAID` })
      .setColor("Red");

    await message.edit({ embeds: [updatedEmbed], components: [] });

    const warrantEmbed = new EmbedBuilder()
      .setTitle("🚨 Warrant Issued")
      .setDescription(`**${civilian.firstName} ${civilian.lastName}** failed to pay a fine of **$${report.fine}**.`)
      .setColor("Red")
      .setTimestamp();

    const channelId = warrantChannels[platform];
    const channel = await client.channels.fetch(channelId);
    await channel.send({ embeds: [warrantEmbed] });
  }, 1000 * 60 * 60 * 24); // 24 hours
}

async function trackFine({ civilianId, reportId, messageId, channelId, platform }) {
  const Civilian = require("./models/Civilian");
  const civilian = await Civilian.findById(civilianId);
  if (!civilian) return;

  const report = civilian.reports.find(r => r.reportId?.toString() === reportId);
  if (!report) return;

  const channel = await client.channels.fetch(channelId);
  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (!message) return;

  scheduleFineCheck(civilian, report, message, platform);
}
module.exports.trackFine = trackFine;

async function sendClockEmbed({ officer, discordId, type, duration }) {
  const user = await client.users.fetch(discordId);
  const platform = officer.department.toLowerCase();
  const logChannelId = platform === "xbox" ? process.env.LOG_CHANNEL_XBOX : process.env.LOG_CHANNEL_PLAYSTATION;
  const logChannel = await client.channels.fetch(logChannelId).catch(() => null);

  const embed = new EmbedBuilder()
    .setTitle(type === "in" ? "🟢 Officer Clocked In" : "🔴 Officer Clocked Out")
    .addFields(
      { name: "Officer", value: `${officer.callsign} (${officer.badgeNumber})`, inline: true },
      { name: "Status", value: type === "in" ? "Clocked In" : `Clocked Out (${duration})`, inline: true }
    )
    .setFooter({ text: type === "in" ? "Duty started." : "Duty ended." })
    .setColor(type === "in" ? 0x00ff00 : 0xff0000)
    .setTimestamp();

  if (user) await user.send({ embeds: [embed] }).catch(() => null);
  if (logChannel) await logChannel.send({ embeds: [embed] });
}

module.exports.sendClockEmbed = sendClockEmbed;

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("✅ MongoDB connected");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});

client.login(process.env.DISCORD_BOT_TOKEN);

module.exports = { client, assignLicenseRole, sendBankApprovalEmbed, trackFine, jailUser };
