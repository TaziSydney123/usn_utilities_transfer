const { SlashCommandBuilder, PermissionFlagsBits, userMention } = require("discord.js");

const { EmbedBuilder } = require("discord.js");

const helpers = require("../helpers");

const SubordinateDatabase = require("../subordinatesDatabase.js").SubordinatesDatabase;

const embedColor = 0x0099FF;

const MAX_MEMBERS_BEFORE_NCO = 10;

const memberReportCommand = new SlashCommandBuilder()
  .setName("member_report")
  .setDescription("Make a full report on a member")
  .addMentionableOption(option =>
    option
      .setName("target")
      .setDescription("The member to get a report on")
      .setRequired(false));

async function getMemberReportEmbed(member, interaction, multipleIndex = null, memberCount = null) {
  const timeInServer = helpers.millisecondsToDisplay((Date.now() - member.joinedTimestamp));
  let voyageStats = interaction.client.officialVoyageCountCache.get(member.guild.id, member.id);

  if (!voyageStats) {
    voyageStats = {
      totalOfficials: 0,
      weeklyOfficials: 0,
      lastOfficial: null,
      totalOfficialsLed: 0,
      weeklyOfficialsLed: 0,
      lastOfficialLed: null,

      hasLastOfficial: false,
      hasLastOfficialLed: false
    };
  }

  const lastVoyage = voyageStats.hasLastOfficial ? helpers.millisecondsToDisplay(Date.now() - voyageStats.lastOfficial, true) : "None";
  const lastVoyageLed = voyageStats.hasLastOfficialLed ? helpers.millisecondsToDisplay(Date.now() - voyageStats.lastOfficialLed, true) : "None";
  const departments = await helpers.getDepartments(member);
  const subordinatesDatabase = new SubordinateDatabase(interaction);
  const immediateSuperiorId = await subordinatesDatabase.getSuperior(member.id);
  const subordinateList = subordinatesDatabase.getAllSubordinatesOfSuperior(member.id);
  let nameChanges = interaction.client.nameUpdates.get(member.id);

  if (nameChanges) {
    nameChanges = nameChanges.map(update => "\"" + update.before + "\" to \"" + update.after + "\" (" + helpers.millisecondsToDisplay(Date.now() - update.date, true) + ")");
    nameChanges = helpers.getElementsUpToStringifiedLength(nameChanges.reverse(), 400);
  }

  let roleChanges = interaction.client.roleUpdates.get(member.id);

  if (roleChanges) {
    roleChanges = await Promise.all(roleChanges.map(async update => (
      update.change === "add" ? "Added " : "Removed ")
      + (interaction.guild.roles.cache.get(update.role) ? interaction.guild.roles.cache.get(update.role).name : "*Unknown Role*")
      + " ("
      + helpers.millisecondsToDisplay(Date.now() - update.date, true)
      + ")"));
    roleChanges = helpers.getElementsUpToStringifiedLength(roleChanges.reverse(), 400);
  }

  let fields = [];
  if (!multipleIndex) {
    fields.push(
      { name: "User ID", value: member.id }
    );
  }

  fields = fields.concat([
    { name: "Time in Server", value: timeInServer, inline: true },
    { name: "Next in Command", value: immediateSuperiorId ? userMention(immediateSuperiorId) : "Not Set", inline: true },
    { name: "SPD Departments", value: departments.length > 0 ? departments.join(", ") : "None", inline: true },
    { name: "Last Ofcl. Voyage", value: lastVoyage, inline: true },
    { name: "Weekly Ofcl. Voyages", value: voyageStats.weeklyOfficials.toString(), inline: true },
    { name: "Total Ofcl. Voyages", value: voyageStats.totalOfficials.toString(), inline: true }
  ]);
  if (helpers.memberHasRole(member, interaction.client.settings.get(interaction.guild.id, "voyagePermissionsRoleId"))) {
    fields.push(
      { name: "Last Ofcl. Voyage Hosted", value: lastVoyageLed, inline: true },
      { name: "Weekly Ofcl. Voyages Hosted", value: voyageStats.weeklyOfficialsLed.toString(), inline: true },
      { name: "Total Ofcl. Voyages Hosted", value: voyageStats.totalOfficialsLed.toString(), inline: true }
    );
  }

  if (!multipleIndex) {
    if (nameChanges) {
      fields.push(
        { name: "Recent Name Changes", value: nameChanges.join("\n"), inline: false }
      );
    }

    if (roleChanges) {
      fields.push(
        { name: "Recent Role Changes", value: roleChanges.join("\n"), inline: false }
      );
    }

    if (subordinateList.length > 0) {
      fields.push({
        name: "Current Subordinates:",
        value: helpers.getMentionsFromIds(subordinateList).join(", "),
        inline: false
      });
    }
  }

  const memberEmbed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(member.displayName)
    .setDescription(userMention(member.id))
    .setThumbnail(member.displayAvatarURL())
    .addFields(fields)
    .setTimestamp();

  if (multipleIndex) {
    memberEmbed.setFooter({ text: `${parseInt(multipleIndex, 10) + 1} of ${memberCount}` });
  }

  return memberEmbed;
}

module.exports = {
  commandInterface: memberReportCommand,
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    let members = [];

    let multiple = false;

    try {
      if (interaction.options.getMentionable("target")) {
        if (interaction.options.getMentionable("target").members) {
          if (interaction.options.getMentionable("target").members.size === 0) {
            interaction.followUp("No members have that role");
            return;
          }

          const { juniorEnlistedRoleId } = interaction.client.settings.get(interaction.guild.id);

          if (interaction.options.getMentionable("target").members.size >= MAX_MEMBERS_BEFORE_NCO && !interaction.member.permissions.has(PermissionFlagsBits.TimeoutMembers)) {
            interaction.followUp("You do not have permission to run this commnd for more than " + MAX_MEMBERS_BEFORE_NCO + " members");
            return;
          }

          members = Array.from(interaction.options.getMentionable("target").members.values());

          multiple = true;
        } else {
          members.push(await interaction.guild.members.fetch(interaction.options.getMentionable("target").id));
        }
      } else {
        members.push(interaction.member);
      }
    } catch {
      interaction.followUp(interaction.options.getMentionable("target") + " does not exist in the server");
      return;
    }

    const embedPromises = members.map((member, index) => multiple
      ? getMemberReportEmbed(member, interaction, index, members.length)
      : getMemberReportEmbed(member, interaction));
  
    Promise.all(embedPromises)
      .then(embeds => {
        const followUpPromises = embeds.map(embed => interaction.followUp({ embeds: [embed] }));
  
        return Promise.all(followUpPromises);
      });
  }
};