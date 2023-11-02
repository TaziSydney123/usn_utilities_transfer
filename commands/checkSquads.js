const { SlashCommandBuilder, PermissionFlagsBits, userMention } = require("discord.js");

const { underscore, bold } = require("discord.js");

const helpers = require("../helpers");

const checkSquadsCommand = new SlashCommandBuilder()
  .setName("check_squads")
  .setDescription("Checks that all JE are in a squad")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addStringOption(option =>
    option
      .setName("ship")
      .setDescription("The ship to check - leave blank for any ship or no ship")
      .setRequired(false)
      .setAutocomplete(true));

module.exports = {
  commandInterface: checkSquadsCommand,
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    if (interaction.options.getString("ship")) {
      if (!helpers.roleExists(interaction, interaction.options.getString("ship"))) {
        interaction.followUp({ ephemeral: true, content: "Could not find a ship with that name" });
        return;
      }
    }

    const members = await interaction.guild.members.fetch();

    const usersNotInSquads = [];
    for (const member of members.values()) {
      const userId = member.id;

      const rolesOfUser = member.roles.cache;
      
      const { E1RoleId } = interaction.client.settings.get(interaction.guildId);
      const { juniorEnlistedRoleId } = interaction.client.settings.get(interaction.guildId);

      const roleIds = rolesOfUser.map(role => role.id);
      const roleNames = rolesOfUser.map(role => role.name);

      if (roleIds.includes(juniorEnlistedRoleId) && !roleIds.includes(E1RoleId)) {
        if (helpers.arrayContainsRegex(roleNames, /[Ss]quad$/g)) {
          continue;
        }
        
        const ship = getShip(roleNames);

        if (!interaction.options.getString("ship")) {
          usersNotInSquads.push(userId);
          continue;
        }

        if (!ship) {
          continue;
        }

        if (ship.toLowerCase() === interaction.options.getString("ship").toLowerCase()) {
          usersNotInSquads.push(userId);
        }
      }
    }

    if (usersNotInSquads.length === 0) {
      await interaction.followUp(bold("All users are in squads!"));
    } else {
      await interaction.followUp(bold(underscore("Users who do not have a squad")) + "\n"
        + usersNotInSquads.map(userId => userMention(userId)).join("\n"));
    }
  },
  async autocomplete(interaction) {
    const choices = [];

    for (const ship of interaction.client.settings.get(interaction.guild.id, "shipOptions")) {
      choices.push({ name: ship, value: ship.toLowerCase() });
    }

    interaction.respond(choices);
  }
};

function getShip(roles) {
  for (const role of roles) {
    if (role.match(/^USS/g)) {
      return role.replace("USS ", "").toLowerCase();
    }
  }

  return null;
}