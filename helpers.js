const { userMention } = require("discord.js");

const humanizeDuration = require("humanize-duration");

function getAllRoles(interaction) {
  const roles = interaction.guild.roles.cache.map(role => role);

  return roles;
}

function getAllRolesOfMember(member) {
  const roles = member.roles.cache.map(role => role);

  return roles;
}

function memberHasRole(member, role) {
  const roles = getAllRolesOfMember(member);
  if (roles.map(role => role.id).includes(role)) {
    return true;
  }
}

function roleExists(interaction, targetRole) {
  const roles = getAllRoles(interaction);

  for (const role of roles) {
    if (role.name.toLowerCase().includes(targetRole)) {
      return true;
    }
  }
}

async function memberIdExists(guild, targetMemberId) {
  const members = await guild.members.fetch();
  for (const member of members.values()) {
    if (member.id === targetMemberId) {
      return true;
    }
  }

  return false;
}

async function getMemberFromUsername(guild, targetMember) {
  const members = await guild.members.fetch();

  for (const member of members.values()) {
    const name = member.displayName;
    if ((name.toLowerCase().endsWith(targetMember.toLowerCase())) || (userMention(member.id).toString() === targetMember)) {
      return member;
    }
  }

  return null;
}

async function getMemberFromId(guild, memberId) {
  return guild.members.fetch(memberId);
}

function millisecondsToDisplay(ms, relative = false) {
  const durationDisplay = humanizeDuration(ms, {
    largest: 2,
    round: true
  });

  if (ms < 1000) {
    return "Just Now";
  }

  return durationDisplay + (relative ? " ago" : "");
}

async function getChannel(guild, name) {
  const channels = await guild.channels.fetch();
  for (const channel of channels.values()) {
    if (!channel) {
      return;
    }

    if (channel.name.includes(name)) {
      return channel;
    }
  }
}

async function getChannelById(guild, channelId) {
  if (isSnowflake(channelId)) {
    return guild.channels.fetch(channelId);
  }
}

async function cacheAllOfficialVoyageCounts(channel) {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  let lastMessageId;

  if (!channel) {
    return;
  }

  const userVoyageStats = {};

  while (true) {
    const options = { limit: 100 };

    if (lastMessageId) {
      options.before = lastMessageId;
    }

    const messages = await channel.messages.fetch(options);
    if (messages.size === 0) {
      break;
    }

    for (const data of messages.map(message => ({ pingedMembers: message.mentions.members, message }))) {
      for (let pingedMember of data.pingedMembers) {
        pingedMember = pingedMember[0];
        if (userVoyageStats[pingedMember]) {
          const currentVoyageStats = userVoyageStats[pingedMember];
          userVoyageStats[pingedMember] = {
            totalOfficials: currentVoyageStats.totalOfficials + 1,
            weeklyOfficials: data.message.createdTimestamp >= thirtyDaysAgo ? currentVoyageStats.weeklyOfficials + 0.25 : currentVoyageStats.weeklyOfficials,
            lastOfficial: currentVoyageStats.lastOfficial,
            totalOfficialsLed: (data.message.author.id === pingedMember ? (currentVoyageStats.totalOfficialsLed + 1) : currentVoyageStats.totalOfficialsLed),
            weeklyOfficialsLed: data.message.createdTimestamp >= thirtyDaysAgo ? (data.message.author.id === pingedMember ? (currentVoyageStats.weeklyOfficialsLed + 0.25) : currentVoyageStats.weeklyOfficialsLed) : currentVoyageStats.weeklyOfficialsLed,
            lastOfficialLed: currentVoyageStats.hasLastOfficialLed ? currentVoyageStats.lastOfficialLed : (data.message.author.id === pingedMember ? data.message.createdTimestamp : currentVoyageStats.lastOfficialLed),

            hasLastOfficial: true,
            hasLastOfficialLed: currentVoyageStats.hasLastOfficialLed ? currentVoyageStats.lastOfficialLed : (data.message.author.id === pingedMember ? true : currentVoyageStats.lastOfficialLed)
          };
        } else {
          userVoyageStats[pingedMember] = {
            totalOfficials: 1,
            weeklyOfficials: data.message.createdTimestamp >= thirtyDaysAgo ? 0.25 : 0,
            lastOfficial: data.message.createdTimestamp,
            totalOfficialsLed: (data.message.author.id === pingedMember ? 1 : 0),
            weeklyOfficialsLed: data.message.createdTimestamp >= thirtyDaysAgo ? (data.message.author.id === pingedMember ? 0.25 : 0) : 0,
            lastOfficialLed: (data.message.author.id === pingedMember) ? data.message.createdTimestamp : null,

            hasLastOfficial: true,
            hasLastOfficialLed: (data.message.author.id === pingedMember)
          };
        }
      }
    }

    if (messages.size > 0) {
      lastMessageId = messages.last().id;
    } else {
      break;
    }
  }

  console.log("Stats: " + userVoyageStats);
  channel.client.officialVoyageCountCache.set(channel.guild.id, userVoyageStats);
  return true;
}

function arrayContainsRegex(array, regex) {
  for (const element of array) {
    if (element.match(regex)) {
      return true;
    }
  }

  return false;
}

async function getDepartments(member) {
  const rolesOfMember = member.roles.cache.map(role => role.name);

  const departments = [];
  for (const role of rolesOfMember) {
    if (role.endsWith(" Department")) {
      departments.push(role.replace(" Department", ""));
    }
  }

  return departments;
}

function flipObjectKeyAndValues(obj) {
  const flipped = Object
    .entries(obj)
    .map(([key, value]) => [value, key]);

  return flipped;
}

async function getUsernamesFromIds(ids, guild) {
  return Promise.all(ids.map(async id => (await guild.members.fetch(id)).displayName));
}

function getMentionsFromIds(ids) {
  return ids.map(id => (userMention(id)));
}

function combineTwoArraysOfSameLengthIntoStringsWithSeparator(array1, array2, separator) {
  const result = [];

  if (!array1 || !array2) {
    return [];
  }

  for (const index in array1) {
    result.push(array1[index] + separator + array2[index]);
  }

  return result;
}

function getElementsUpToStringifiedLength(array, maxLength, joiner = "\n") {
  let popped = 0;

  let wentOverMax = false;

  while (array.join(joiner).length + (" + " + popped.toString() + " more").length >= maxLength) {
    array.pop();
    popped += 1;
    wentOverMax = true;
  }

  if (wentOverMax) {
    array.push(" + " + popped.toString() + " more");
  }

  return array;
}

function getElementAddedOrRemovedFromTwoArrays(oldArray, newArray) {
  const added = newArray.find(x => !oldArray.includes(x));
  const removed = oldArray.find(x => !newArray.includes(x));

  return { element: added ? added : removed, change: added ? "add" : (removed ? "remove" : "none") };
}

function cacheOfficialVoyageCountValues(member, values, date = Date.now()) {
  member.client.officialVoyageCountCache.set(member.id, { voyageStats: values.voyageStats, cacheDate: date }, "members");
}

function getMessageFromMessageContent(messageContent) {
  return messageContent[1];
}

function getTimestampFromHammertime(hammertimeTimestamp) {
  return (parseInt(hammertimeTimestamp.match(/\d+/), 10) * 1000);
}

function isSnowflake(str) {
  const snowflakeRegex = /^[0-9]{17,19}$/;
  return snowflakeRegex.test(str);
}

module.exports = {
  getAllRoles,
  getAllRolesOfMember,
  memberHasRole,
  roleExists,
  memberIdExists,
  getMemberFromUsername,
  getMemberFromId,
  millisecondsToDisplay,
  getChannel,
  getChannelById,
  arrayContainsRegex,
  flipObjectKeyAndValues,
  cacheAllOfficialVoyageCounts,
  getDepartments,
  getUsernamesFromIds,
  getMentionsFromIds,
  combineTwoArraysOfSameLengthIntoStringsWithSeparator,
  getElementsUpToStringifiedLength,
  getElementAddedOrRemovedFromTwoArrays,
  cacheOfficialVoyageCountValues,
  getMessageFromMessageContent,
  getTimestampFromHammertime,
  isSnowflake
};