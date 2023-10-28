const logger = require("./logger");
const helpers = require("./helpers");

const { userMention } = require("discord.js");

async function execute(client, subordinateDatabase, member) {
  if (member.id === client.user.id) {
    // Called only when the bot is removed from a guild
    return;
  }

  logger.info(`Member ${member.id} "${member.displayName}" left/removed from the server`);

  const superior = await subordinateDatabase.getSuperior(member.id);

  subordinateDatabase.removeSubordinateReference(member.id);

  const actingFor = subordinateDatabase.getActingFor(member.id);

  if (actingFor) {
    subordinateDatabase.reclaimSubordinates(actingFor);
  }

  subordinateDatabase.reclaimSubordinates(member.id);

  const clearedSubordinates = subordinateDatabase.clearSubordinates(member.id);
  const clearedSubordinatesNames = await helpers.getUsernamesFromIds(clearedSubordinates, member.guild);
  const clearedSubordinatesDisplay = helpers.combineTwoArraysOfSameLengthIntoStringsWithSeparator(clearedSubordinatesNames, clearedSubordinates, " -- ");

  const alertChannelName = client.settings.get(member.guild.id, "botWarningChannel");
  logger.debug(alertChannelName);
  const alertChannel = await helpers.getChannel(member.guild, alertChannelName);

  if (alertChannel && (clearedSubordinates.length > 0 || actingFor)) {
    await alertChannel.send(
      `-------------------------\n${userMention(member.id)} **has left the server!**
  ${(superior ? "Next in Command: " + userMention(superior) + "\n" : "")}${((actingFor && actingFor !== superior) ? "Acting in Place For: " + userMention(actingFor) : "")}${(clearedSubordinates.length > 0 ? "**Subordinate List:**\n" + clearedSubordinatesDisplay.join("\n") : "")}`
    );
  }
}

module.exports = {
  execute
};