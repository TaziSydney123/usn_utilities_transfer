const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const forceCacheCommand = new SlashCommandBuilder()
  .setName("recruit_approve")
  .setDescription("Approve a recruit into the navy at the rank E-1")
  .addUserOption(option =>
    option
      .setName("user")
      .setDescription("The user to approve")
      .setRequired(true))
  .addStringOption(option =>
    option
      .setName("name")
      .setDescription("The name chosen for this user to go by")
      .setRequired(true));

module.exports = {
  commandInterface: forceCacheCommand,
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const member = await interaction.guild.members.fetch(interaction.options.getUser("user").id);
    const { civilianRoleId } = interaction.client.settings.get(interaction.guildId);
    const { juniorEnlistedRoleId } = interaction.client.settings.get(interaction.guildId);
    const { E1RoleId } = interaction.client.settings.get(interaction.guildId);

    if (member.roles.cache.some(role => role.id === civilianRoleId)) {
      member.roles.add([juniorEnlistedRoleId, E1RoleId]);
      member.roles.remove(civilianRoleId);
      member.setNickname(`Seaman Recruit ${interaction.options.getString("name")}`);

      member.send({ embeds: [getWelcomeEmbed(interaction)] });
    } else {
      interaction.followUp({ ephemeral: true, content: "That person does not have the Civilian role. They were not approved as a recruit." });
      return;
    }

    await interaction.followUp({ ephemeral: true, content: `Successfully approved ${interaction.options.getUser("user")} into the navy with the name ${interaction.options.getString("name")}!` });
  }
};

function getWelcomeEmbed(interaction) {
  const { recruitBarracksChannelId } = interaction.client.settings.get(interaction.guildId);
  const { trainingScheduleChannelId } = interaction.client.settings.get(interaction.guildId);

  return new EmbedBuilder()
    .setColor(0x1F8B4C)
    .setTitle("Welcome to the United States Navy of Sea of Theives")
    .setDescription(`Welcome to the USN of SoT, Seaman Recruit ${interaction.options.getString("name")}! Your first order of business is to get yourself trained. When you have time to spare, check out <#${trainingScheduleChannelId}> to see if any trainers are available and ping Recruiting Department in <#${recruitBarracksChannelId}>. May the wind bless your sails!`)
    .setFooter({ text: "United States Navy of Sea of Theives" });
}