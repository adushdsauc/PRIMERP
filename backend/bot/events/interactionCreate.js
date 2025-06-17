const { Events, InteractionType } = require('discord.js');
const handleButtonInteractions = require('./buttonInteractions');
const handleModalSubmissions = require('./modalSubmissions');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isButton()) {
      return handleButtonInteractions(interaction);
    }

    if (interaction.type === InteractionType.ModalSubmit) {
      return handleModalSubmissions(interaction);
    }

    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command || !command.autocomplete) return;
      try {
        await command.autocomplete(interaction);
      } catch (err) {
        console.error('Autocomplete error:', err);
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (err) {
      console.error('Command execution error:', err);
    }
  }
};
