const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");

const { underscore, bold } = require("discord.js");

const configCommand = new SlashCommandBuilder()
  .setName("config")
  .setDescription("Configuration settings for the bot")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

module.exports = {
  commandInterface: configCommand,
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const selectSettingRow = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("settingSelect")
          .setPlaceholder("Select a setting")
          .addOptions(
            {
              label: "Ship Options",
              value: "shipOptions"
            },
            {
              label: "Channels",
              value: "channels"
            },
            {
              label: "Voyage Permissions Role",
              value: "voyagePermissionsRole"
            },
            {
              label: "Voyage Options",
              value: "voyageOptions"
            },
            {
              label: "Recruiting Options",
              value: "recruitingOptions"
            },
            {
              label: "Overdue Hosting Options",
              value: "overdueHostingOptions"
            }
          )
      );

    await interaction.followUp({
      content: bold(underscore("Bot Configuration")) + `
Ship Options: Options for the ships when using the /check_squads command
Channels: Options for important channels, such as the voyage logbook channel
Voyage Permissions Role: Options for the role used to indicate voyage permissions
Voyage Options: Options for the official voyage commands
Recruiting Options: Options for the recruiting command
Overdue Hosting Options: Options for the overdue host checker`,
      components: [selectSettingRow]
    });
  }
};