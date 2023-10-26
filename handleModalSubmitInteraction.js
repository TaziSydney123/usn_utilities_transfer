const { SubordinatesDatabase } = require("./subordinatesDatabase");

const helpers = require("./helpers");

async function execute(interaction) {
  if (interaction.customId === "shipOptions") {
    await interaction.deferReply({ ephemeral: true });
    interaction.client.settings.set(interaction.guild.id, interaction.fields.getTextInputValue("shipOptionsInput").split("\n"), "shipOptions");
    await interaction.followUp("Successfully changed ship options");
  } else if (interaction.customId === "channels") {
    await interaction.deferReply({ ephemeral: true });
    const nullChannels = [];

    for (const component of interaction.components.map(component => component.components[0])) {
      interaction.client.settings.set(interaction.guild.id, component.value, component.customId.replace("Input", ""));
      if (!(await channelExists(interaction.guild, component.value))) {
        nullChannels.push(component.value);
      }
    }

    if (nullChannels.length === 0) {
      await interaction.followUp("Successfully set channels");
    } else {
      await interaction.followUp("**Successfully set channels with warning(s):**\n"
        + (nullChannels.length > 0 ? ("The following channel ID(s) could not be found:\n" + nullChannels.join("\n")) : ""));
    }
  } else if (interaction.customId.startsWith("setSubordinates")) {
    await interaction.deferReply({ ephemeral: false });
    const settingTo = interaction.customId.replace("setSubordinates-", "");
    const subordinateDB = new SubordinatesDatabase(interaction);

    const setSubordinates = await subordinateDB.setSubordinatesToSuperior(settingTo, interaction.fields.getTextInputValue("subordinatesInput").split("\n"));

    if (setSubordinates.nullIds.length + setSubordinates.takenIds.length === 0) {
      await interaction.followUp("Successfully set subordinates");
    } else {
      await interaction.followUp("**Successfully set subordinates with warning(s):**\n"
        + (setSubordinates.nullIds.length > 0 ? ("The following member(s) could not be found so their CO has not been set:\n" + setSubordinates.nullIds.join("\n")) : "")
        + (setSubordinates.nullIds.length > 0 ? "\n" : "")
        + (setSubordinates.takenIds.length > 0 ? ("The following member(s) already had a CO and have not been set:\n" + setSubordinates.takenIds.join("\n")) : ""));
    }
  } else if (interaction.customId === "voyagePermissionsRoleId") {
    await interaction.deferReply({ ephemeral: true });

    const roleID = interaction.fields.getTextInputValue("voyagePermissionsRoleInput");

    if (roleIdExists(interaction.guild, roleID)) {
      interaction.client.settings.set(interaction.guild.id, roleID, "voyagePermissionsRoleId");
      await interaction.followUp("Successfully set the voyage permissions role ID");
    } else {
      await interaction.followUp("A role with that ID could not be found!");
    }
  } else if (interaction.customId === "voyageOptions") {
    await interaction.deferReply({ ephemeral: true });

    interaction.client.settings.set(interaction.guild.id, interaction.fields.getTextInputValue("voyageTypes").replace(",", "").split("\n"), "voyageTypes");
    interaction.client.settings.set(interaction.guild.id, interaction.fields.getTextInputValue("voyageTypeRoleIds").replace(",", "").split("\n"), "voyageTypeRoleIds");
    
    const minTime = interaction.fields.getTextInputValue("minimumTime");
    const maxTime = interaction.fields.getTextInputValue("maximumTime");

    const reactionId = interaction.fields.getTextInputValue("defaultReactionId");

    const invalidVoyageTypeRoleIds = [];
    for (const voyageTypeRoleId of interaction.fields.getTextInputValue("voyageTypeRoleIds").replace(",", "").split("\n")) {
      if (!roleIdExists(voyageTypeRoleId)) {
        invalidVoyageTypeRoleIds.push(voyageTypeRoleId);
      }
    }

    if (minTime > maxTime) {
      await interaction.followUp("You can not set the minimum time higher than the maximum time! Try again.");
    } else if (!(await emojiIdExists(interaction.guild, reactionId))) {
      await interaction.followUp("That voyage reaction ID is invalid. Try again.");
    } else if (invalidVoyageTypeRoleIds.length > 0) {
      await interaction.followUp("The following voyage type role ID(s) could not be found:\n" + invalidVoyageTypeRoleIds.join("\n"));
    } else {
      interaction.client.settings.set(interaction.guild.id, minTime, "minimumTime");
      interaction.client.settings.set(interaction.guild.id, maxTime, "maximumTime");
      interaction.client.settings.set(interaction.guild.id, reactionId, "defaultReactionId");

      await interaction.followUp("Successfully set voyage options");
    }
  } else if (interaction.customId === "recruitingOptions") {
    await interaction.deferReply({ ephemeral: true });

    const channels = [
      { name: "Training Schedule Channel ID", found: interaction.fields.getTextInputValue("trainingScheduleChannelId") },
      { name: "Recruit Barracks Channel ID", found: interaction.fields.getTextInputValue("recruitBarracksChannelId") }
    ];

    const roles = [
      { name: "Civilian Role ID", found: interaction.fields.getTextInputValue("civilianRoleId") },
      { name: "Junior Enlisted Role ID", found: interaction.fields.getTextInputValue("juniorEnlistedRoleId") },
      { name: "Seaman Recruit Role ID", found: interaction.fields.getTextInputValue("E1RoleId") }
    ];

    const invalidChannels = [];
    
    for (const channel of channels) {
      if (!channelExists(interaction.guild, channel.found)) {
        invalidChannels.push(channel.name);
      }
    }
    
    const invalidRoles = [];
    
    for (const role of roles) {
      if (!roleIdExists(interaction.guild, role.found)) {
        invalidRoles.push(role.name);
      }
    }

    interaction.client.settings.set(interaction.guild.id, interaction.fields.getTextInputValue("civilianRoleId"), "civilianRoleId");
    interaction.client.settings.set(interaction.guild.id, interaction.fields.getTextInputValue("juniorEnlistedRoleId"), "juniorEnlistedRoleId");
    interaction.client.settings.set(interaction.guild.id, interaction.fields.getTextInputValue("E1RoleId"), "E1RoleId");
    interaction.client.settings.set(interaction.guild.id, interaction.fields.getTextInputValue("trainingScheduleChannelId"), "trainingScheduleChannelId");
    interaction.client.settings.set(interaction.guild.id, interaction.fields.getTextInputValue("recruitBarracksChannelId"), "recruitBarracksChannelId");

    if (invalidChannels.length > 0) {
      await interaction.followUp("The following channel(s) could not be found:\n" + invalidChannels.join("\n"));
    } else if (invalidRoles.length > 0) {
      await interaction.followUp("The following role(s) could not be found:\n" + invalidRoles.join("\n"));
    }

    await interaction.followUp({ content: "Successfully set recruiting options", ephemeral: true });
  } else if (interaction.customId === "overdueHostingOptions") {
    await interaction.deferReply({ ephemeral: true });

    if (!(await userExists(interaction.guild, interaction.fields.getTextInputValue("logisticsHeadId")))) {
      await interaction.followUp("The Logistics Head ID is not valid!");
      return;
    }
    
    interaction.client.settings.set(interaction.guild.id, interaction.fields.getTextInputValue("logisticsHeadId"), "logisticsHeadId");
    interaction.client.settings.set(interaction.guild.id, interaction.fields.getTextInputValue("maxDaysWithoutHosting"), "maxDaysWithoutHosting");

    await interaction.followUp("Successfully set overdue hosting options");
  }
}

async function roleIdExists(guild, roleId) {
  if (helpers.isSnowflake(roleId)) {
    const roleIds = Array.from((await guild.roles.fetch()).keys());
  
    if (roleIds.includes(roleId)) {
      return true;
    }
  }

  return false;
}

async function emojiIdExists(guild, emojiId) {
  if (helpers.isSnowflake(emojiId)) {
    const emojiIds = Array.from((await guild.emojis.fetch()).keys());
  
    if (emojiIds.includes(emojiId)) {
      return true;
    }
  }

  return false;
}

async function channelExists(guild, channelId) {
  if (helpers.isSnowflake(channelId)) {
    const channelIds = Array.from((await guild.channels.fetch()).keys());

    if (channelIds.includes(channelId)) {
      return true;
    }
  }
  
  return false;
}

async function userExists(guild, userId) {
  if (helpers.isSnowflake(userId)) {
    const userIds = Array.from((await guild.members.fetch()).keys());
    if (userIds.includes(userId)) {
      return true;
    }
  }
  
  return false;
}

module.exports = {
  execute
};