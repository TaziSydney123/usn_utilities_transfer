const { SlashCommandBuilder } = require("discord.js");

const pingCommand = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Pings the bot");

module.exports = {
  commandInterface: pingCommand,
  async execute(interaction) {
    const startTime = Date.now();
    await interaction.deferReply({ ephemeral: false });
    const endTime = Date.now();
    const latency = endTime - startTime;
    await interaction.followUp(`Pong! :ping_pong: Latency: ${latency}ms`);
  }
};