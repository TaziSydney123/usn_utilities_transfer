const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const helpers = require("../helpers");

const forceCacheCommand = new SlashCommandBuilder()
  .setName("update_officials")
  .setDescription("Force an update of the official voyage counts")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

module.exports = {
  commandInterface: forceCacheCommand,
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const cachedOfficials = await helpers.cacheAllOfficialVoyageCounts(await interaction.guild.channels.fetch(interaction.client.settings.get(interaction.guild.id, "voyageLogbookChannel")));
    await interaction.followUp(cachedOfficials ? "Successfully updated official voyage counts" : { ephemeral: true, content: "Failed to update official voyage counts" });
  }
};