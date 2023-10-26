const { ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder } = require("discord.js");

const MIN_INPUT_LENGTH = 2;
const MAX_INPUT_LENGTH = 150;

async function execute(interaction) {
  if (interaction.customId === "settingSelect") {
    if (interaction.values[0] === "shipOptions") {
      const modal = new ModalBuilder()
        .setCustomId("shipOptions")
        .setTitle("Ship Options");

      const shipOptionsInput = new TextInputBuilder()
        .setCustomId("shipOptionsInput")
        .setLabel("Put one ship name on each line - without USS")
        .setStyle(TextInputStyle.Paragraph)
        .setValue(interaction.client.settings.get(interaction.guild.id, "shipOptions").join("\n") ?? "Enter ships seperated by a new line");

      const firstActionRow = new ActionRowBuilder().addComponents(shipOptionsInput);

      modal.addComponents(firstActionRow);
      await interaction.showModal(modal);
    } else if (interaction.values[0] === "channels") {
      const modal = new ModalBuilder()
        .setCustomId("channels")
        .setTitle("Important Channels (By ID)");

      const logbookChannelValue = interaction.client.settings.get(interaction.guild.id, "voyageLogbookChannelId");
      const logbookChannelInput = new TextInputBuilder()
        .setCustomId("voyageLogbookChannelInput")
        .setLabel("The voyage logbook channel ID")
        .setStyle(TextInputStyle.Short)
        .setValue(logbookChannelValue.length >= MIN_INPUT_LENGTH ? logbookChannelValue : "No valid ID found!")
        .setMaxLength(MAX_INPUT_LENGTH)
        .setMinLength(MIN_INPUT_LENGTH);

      const botWarningChannelValue = interaction.client.settings.get(interaction.guild.id, "botWarningChannel");
      const botWarningChannelInput = new TextInputBuilder()
        .setCustomId("botWarningChannelInput")
        .setLabel("The channel for bot alerts")
        .setStyle(TextInputStyle.Short)
        .setValue(botWarningChannelValue.length >= MIN_INPUT_LENGTH ? botWarningChannelValue : "No valid ID found!")
        .setMaxLength(MAX_INPUT_LENGTH)
        .setMinLength(MIN_INPUT_LENGTH);

      const requestingVoyageChannelValue = interaction.client.settings.get(interaction.guild.id, "requestingVoyageChannel");
      const requestingVoyageChannelInput = new TextInputBuilder()
        .setCustomId("requestingVoyageChannel")
        .setLabel("The channel with sailors requesting to sail")
        .setStyle(TextInputStyle.Short)
        .setValue(requestingVoyageChannelValue.length >= MIN_INPUT_LENGTH ? requestingVoyageChannelValue : "No valid ID found!")
        .setMaxLength(MAX_INPUT_LENGTH)
        .setMinLength(MIN_INPUT_LENGTH);

      const inputs = [logbookChannelInput, botWarningChannelInput, requestingVoyageChannelInput];

      const actionRows = inputs.map(input => new ActionRowBuilder().addComponents(input));

      modal.addComponents(...actionRows);
      await interaction.showModal(modal);
    } else if (interaction.values[0] === "voyagePermissionsRoleId") {
      const modal = new ModalBuilder()
        .setCustomId("voyagePermissionsRoleId")
        .setTitle("Voyage Permissions Role ID");

      const roleValue = interaction.client.settings.get(interaction.guild.id, "voyagePermissionsRoleId");
      const roleInput = new TextInputBuilder()
        .setCustomId("voyagePermissionsRoleInput")
        .setLabel("The name of the voyage permissions role")
        .setStyle(TextInputStyle.Short)
        .setValue(roleValue.length >= MIN_INPUT_LENGTH ? roleValue : "No valid ID found!")
        .setMaxLength(MAX_INPUT_LENGTH)
        .setMinLength(MIN_INPUT_LENGTH);

      const firstActionRow = new ActionRowBuilder().addComponents(roleInput);

      modal.addComponents(firstActionRow);
      await interaction.showModal(modal);
    } else if (interaction.values[0] === "recruitingOptions") {
      const modal = new ModalBuilder()
        .setCustomId("recruitingOptions")
        .setTitle("Recruiting Options");

      const civilianRoleIdValue = interaction.client.settings.get(interaction.guild.id, "civilianRoleId");
      const civilianRoleId = new TextInputBuilder()
        .setCustomId("civilianRoleId")
        .setLabel("The ID for the \"Civilian\" role")
        .setStyle(TextInputStyle.Short)
        .setValue(civilianRoleIdValue.length >= MIN_INPUT_LENGTH ? civilianRoleIdValue : "No valid ID found!")
        .setMaxLength(MAX_INPUT_LENGTH)
        .setMinLength(MIN_INPUT_LENGTH);

      const juniorEnlistedRoleIdValue = interaction.client.settings.get(interaction.guild.id, "juniorEnlistedRoleId");
      const juniorEnlistedRoleId = new TextInputBuilder()
        .setCustomId("juniorEnlistedRoleId")
        .setLabel("The ID for the \"Junior Enlisted\" role")
        .setStyle(TextInputStyle.Short)
        .setValue(juniorEnlistedRoleIdValue.length >= MIN_INPUT_LENGTH ? juniorEnlistedRoleIdValue : "No valid ID found!")
        .setMaxLength(MAX_INPUT_LENGTH)
        .setMinLength(MIN_INPUT_LENGTH);

      const E1RoleIdValue = interaction.client.settings.get(interaction.guild.id, "E1RoleId");
      const E1RoleId = new TextInputBuilder()
        .setCustomId("E1RoleId")
        .setLabel("The ID for the \"Seaman Recruit\" role")
        .setStyle(TextInputStyle.Short)
        .setValue(E1RoleIdValue.length >= MIN_INPUT_LENGTH ? E1RoleIdValue : "No valid ID found!")
        .setMaxLength(MAX_INPUT_LENGTH)
        .setMinLength(MIN_INPUT_LENGTH);

      const trainingScheduleChannelIdValue = interaction.client.settings.get(interaction.guild.id, "trainingScheduleChannelId");
      const trainingScheduleChannelId = new TextInputBuilder()
        .setCustomId("trainingScheduleChannelId")
        .setLabel("The ID for recruit training schedule channel")
        .setStyle(TextInputStyle.Short)
        .setValue(trainingScheduleChannelIdValue.length >= MIN_INPUT_LENGTH ? trainingScheduleChannelIdValue : "No valid ID found!")
        .setMaxLength(MAX_INPUT_LENGTH)
        .setMinLength(MIN_INPUT_LENGTH);

      const recruitBarracksChannelIdValue = interaction.client.settings.get(interaction.guild.id, "recruitBarracksChannelId");
      const recruitBarracksChannelId = new TextInputBuilder()
        .setCustomId("recruitBarracksChannelId")
        .setLabel("The ID for recruit barracks channel")
        .setStyle(TextInputStyle.Short)
        .setValue(recruitBarracksChannelIdValue.length >= MIN_INPUT_LENGTH ? recruitBarracksChannelIdValue : "No valid ID found!")
        .setMaxLength(MAX_INPUT_LENGTH)
        .setMinLength(MIN_INPUT_LENGTH);

      const inputs = [civilianRoleId, juniorEnlistedRoleId, E1RoleId, trainingScheduleChannelId, recruitBarracksChannelId];
      const actionRows = inputs.map(input => new ActionRowBuilder().addComponents(input));

      modal.addComponents(...actionRows);
      await interaction.showModal(modal);
    } else if (interaction.values[0] === "overdueHostingOptions") {
      const modal = new ModalBuilder()
        .setCustomId("overdueHostingOptions")
        .setTitle("Overdue Hosting Options");

      const logisticsHeadIdValue = interaction.client.settings.get(interaction.guild.id, "logisticsHeadId");
      const logisticsHeadId = new TextInputBuilder()
        .setCustomId("logisticsHeadId")
        .setLabel("The ID for the head of Logistics")
        .setStyle(TextInputStyle.Short)
        .setValue(logisticsHeadIdValue.length >= MIN_INPUT_LENGTH ? logisticsHeadIdValue : "No valid ID found!")
        .setMaxLength(MAX_INPUT_LENGTH)
        .setMinLength(MIN_INPUT_LENGTH);

      const maxDaysWithoutHostingValue = interaction.client.settings.get(interaction.guild.id, "maxDaysWithoutHosting");
      const maxDaysWithoutHosting = new TextInputBuilder()
        .setCustomId("maxDaysWithoutHosting")
        .setLabel("The max days without hosting a voyage")
        .setStyle(TextInputStyle.Short)
        .setValue(maxDaysWithoutHostingValue.length >= MIN_INPUT_LENGTH ? maxDaysWithoutHostingValue : "No amount found!")
        .setMaxLength(MAX_INPUT_LENGTH)
        .setMinLength(MIN_INPUT_LENGTH);

      const inputs = [logisticsHeadId, maxDaysWithoutHosting];
      const actionRows = inputs.map(input => new ActionRowBuilder().addComponents(input));

      modal.addComponents(...actionRows);
      await interaction.showModal(modal);
    }
  }
}

module.exports = {
  execute
};