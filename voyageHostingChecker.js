const helpers = require("./helpers.js");

const { CronJob } = require("cron");

function startVoyageHostingChecker(client) {
  const job = new CronJob(
    "0 16 * * 5",
    (async () => {
      await messageImportantMembersAboutMembersOverdueForHosting(client);
    }),
    null,
    true,
    "Atlantic/Azores"
  );

  job.start();
}

const USN_OF_SOT_SERVER_ID = "933907909954371654";

const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

const TIME_TO_HOST_AFTER_LOA = DAY_IN_MILLISECONDS * 3;

const LOA_REGEX = /\[LOA-[12]\].*/g;

async function messageImportantMembersAboutMembersOverdueForHosting(client) {
  const guild = await client.guilds.fetch(USN_OF_SOT_SERVER_ID);

  const USER_IDS_TO_MESSAGE = [client.settings.get(guild.id, "logisticsHeadId")];

  const overdueHostingMessage = await createOverdueHostingMessage(client);

  const DmPromises = [];
  
  for (const userId of USER_IDS_TO_MESSAGE) {
    DmPromises.push(client.users.createDM(userId));
  }

  await Promise.all(DmPromises);

  for (const userDM of DmPromises) {
    userDM.send(overdueHostingMessage);
  }
}

function memberOffLoaInPastTwoDays(client, memberId) {
  if (client.nameUpdates.get(memberId)) {
    for (const nameUpdate of client.nameUpdates.get(memberId)) {
      if (!(Date.now - nameUpdate.date > TIME_TO_HOST_AFTER_LOA)) {
        if (LOA_REGEX.test(nameUpdate.before)) {
          return true;
        }
      }
    }
  }

  return false;
}

async function getUserIdsOverdueForHosting(client) {
  const guild = await client.guilds.fetch(USN_OF_SOT_SERVER_ID);

  const officialVoyageStatistics = client.officialVoyageCountCache.get(guild.id);

  const userIdsOverdueForHosting = [];

  const maxDaysWithoutHosting = client.settings.get(guild.id, "maxDaysWithoutHosting");
  
  const MAX_TIME_WITHOUT_HOSTING = DAY_IN_MILLISECONDS * maxDaysWithoutHosting;

  const memberPromises = [];
  const memberData = [];
  
  for (const [userId, voyageStats] of Object.entries(officialVoyageStatistics)) {
    if (Date.now() - voyageStats.lastOfficialLed > MAX_TIME_WITHOUT_HOSTING) {
      memberPromises.push(guild.members.fetch(userId));
      memberData.push({ userId, lastOfficialLed: voyageStats.lastOfficialLed });
    }
  }

  await Promise.all(memberPromises);

  for (const member of memberPromises) {
    if (LOA_REGEX.test(member.displayName)) {
      continue;
    } // Kept for clean code: if efficiency is needed, replace with a system based on client.nameUpdates

    if (memberOffLoaInPastTwoDays(client, member.id)) {
      continue;
    }

    if (!helpers.memberHasRole(member, client.settings.get(guild.id, "voyagePermissionsRoleId"))) {
      continue;
    }

    userIdsOverdueForHosting.push({ userId: memberData[memberPromises.indexOf(member)].userId, lastOfficialLed: memberData[memberPromises.indexOf(member)].lastOfficialLed });
  }

  return userIdsOverdueForHosting;
}

async function createOverdueHostingMessage(client) {
  let userIdsOverdueForHosting = await getUserIdsOverdueForHosting(client);
  userIdsOverdueForHosting = userIdsOverdueForHosting.filter(userData => userData.lastOfficialLed !== null);
  let membersOverdueMessage = "No users are overdue for hosting a voyage";
  if (userIdsOverdueForHosting.length >= 1) {
    membersOverdueMessage
    = `**The current users are overdue for hosting a voyage on <t:${Math.floor(Date.now() / 1000)}:D>**
    
    ${(await Promise.all(userIdsOverdueForHosting.map(async userData => {
    const member = await ((await client.guilds.fetch(USN_OF_SOT_SERVER_ID)).members.fetch(userData.userId));
    return `${member.displayName} (${member.id}) | Last hosted: <t:${Math.floor(userData.lastOfficialLed / 1000)}:D>`;
  }))).join("\n")}`;
  }

  return membersOverdueMessage;
}

module.exports = {
  startVoyageHostingChecker,
  createOverdueHostingMessage
};
