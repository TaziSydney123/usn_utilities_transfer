async function execute(interaction) {
  if (interaction.customId.startsWith("showSubordinateIdsButton-")) {
    const subordinates = interaction.customId.replace("showSubordinateIdsButton-", "").split(";");
    await interaction.followUp({ ephemeral: true, content: subordinates.join("\n") });
  }
}

module.exports = {
  execute
};