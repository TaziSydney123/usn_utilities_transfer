const logger = require("./logger");

const { parsed, error } = require("dotenv").config({ path: "./process.env" });
if (error) {
  throw error;
}

const { REST, Routes } = require("discord.js");

const Enmap = require("enmap");

const { Events } = require("discord.js");

const { SubordinatesDatabase } = require("./subordinatesDatabase");

const handleGuildMemberRemoval = require("./handleGuildMemberRemoval").execute;

const { Collection } = require("discord.js");

const helpers = require("./helpers.js");

const glob = require("glob");

const voyageHostingChecker = require("./voyageHostingChecker.js");

const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessages],
  partials: [],
  autofetch: [
    "MESSAGE_CREATE",
    "MESSAGE_UPDATE",
    "MESSAGE_REACTION_ADD",
    "MESSAGE_REACTION_REMOVE"
  ]
});

const MILLISECONDS_IN_30_DAYS = 1000 * 60 * 60 * 24 * 30;

const DEVELOPER_IDS = ["503365199395291139", "657697825110622209"];

client.settings = new Enmap({
  name: "settings",
  fetchAll: true,
  autoFetch: true,
  cloneLevel: "deep",
  autoEnsure: {
    shipOptions: [
      "Albatross",
      "Constitution",
      "Thunderbolt",
      "Kearsarge",
      "Tennessee"
    ],
    voyageLogbookChannelId: "",
    voyagePermissionsRoleId: "",
    botWarningChannel: "",
    civilianRoleId: "934091342970253342",
    juniorEnlistedRoleId: "933917171132825620",
    E1RoleId: "933913081099214848",
    trainingScheduleChannelId: "",
    recruitBarracksChannelId: "",
    logisticsHeadId: "",
    maxDaysWithoutHosting: "14"
  }
});

client.subordinates = new Enmap({
  name: "subordinates",
  fetchAll: true,
  autoFetch: true,
  cloneLevel: "deep",
  ensureProps: true
});

client.actingSuperiors = new Enmap({
  name: "actingSuperiors",
  fetchAll: true,
  autoFetch: true,
  cloneLevel: "deep",
  ensureProps: true
});

client.officials = new Enmap({
  name: "officials",
  fetchAll: true,
  autoFetch: true,
  cloneLevel: "deep",
  ensureProps: true
});

client.nameUpdates = new Enmap({
  name: "nameUpdates",
  fetchAll: true,
  autoFetch: true,
  cloneLevel: "deep",
  ensureProps: true
});

client.roleUpdates = new Enmap({
  name: "roleUpdates",
  fetchAll: true,
  autoFetch: true,
  cloneLevel: "deep",
  ensureProps: true
});

client.officialVoyageCountCache = new Enmap({
  name: "officialVoyageCountCache",
  fetchAll: true,
  autoFetch: true,
  cloneLevel: "deep",
  ensureProps: true
});

const commands = [];

const approvedGuilds = ["933907909954371654"];

client.on(Events.ClientReady, async client => {
  logger.info(`Logged in as "${client.user.tag}"`);

  const rest = new REST({ version: "10" }).setToken(parsed.TOKEN);

  logger.info("-------------------Reloading Commands-------------------");
  
  client.commands = new Collection();

  const getDirectories = function (callback) {
    glob("./commands/**/*.js", callback);
  };

  getDirectories(async (err, res) => {
    if (err) {
      console.error("Error", err);
    } else {
      for (const filePath of res) {
        const command = require(filePath);

        if ("commandInterface" in command && "execute" in command) {
          client.commands.set(command.commandInterface.name, command);
          commands.push(command.commandInterface.toJSON());
        } else {
          logger.warn(`The command at ${filePath} is missing a required "commandInterface" or "execute" property.`);
        }
      }

      (async () => {
        try {
          logger.info(`Started reloading ${commands.length} application (/) commands.`);
          const data = await rest.put(
            Routes.applicationCommands(parsed.CLIENT_ID),
            { body: commands }
          );

          logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
        } catch (error) {
          logger.error(error);
        }
      })();

      await setupGuilds(client);
    }
  });
});

async function setupGuilds(client) {
  const guilds = await client.guilds.fetch();
  let completedGuilds = 0;
  
  logger.info("-------------------Setting Up Guilds-------------------");
  
  guilds.forEach(async partialGuild => {
    if (approvedGuilds.includes((await partialGuild.fetch()).id)) {
      logger.info("Caching Voyages for guild " + (await partialGuild.fetch()).id);
      await helpers.cacheAllOfficialVoyageCounts(await helpers.getChannelById(await partialGuild.fetch(), client.settings.get((await partialGuild.fetch()).id, "voyageLogbookChannelId")));
      completedGuilds += 1;
      if (completedGuilds === guilds.size) {
        logger.info("Guild Setup Complete");
      }
    }
  });
}

client.on(Events.GuildMemberRemove, async member => {
  const subordinatesDatabase = new SubordinatesDatabase({ guild: member.guild, client });

  handleGuildMemberRemoval(client, subordinatesDatabase, member);
});

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (oldMember.displayName !== newMember.displayName) {
    client.nameUpdates.ensure(newMember.id, []);
    let oldNameUpdates = client.nameUpdates.get(newMember.id);
    oldNameUpdates = oldNameUpdates.filter(update => Date.now() - update.date <= (MILLISECONDS_IN_30_DAYS));
    oldNameUpdates.push({ before: oldMember.displayName, after: newMember.displayName, date: Date.now() });
    client.nameUpdates.set(newMember.id, oldNameUpdates);
  }

  if (helpers.getAllRolesOfMember(oldMember).map(role => role.id).join("") !== (helpers.getAllRolesOfMember(newMember).map(role => role.id).join(""))) {
    client.roleUpdates.ensure(newMember.id, []);
    let oldRoleUpdates = client.roleUpdates.get(newMember.id);
    oldRoleUpdates = oldRoleUpdates.filter(update => Date.now() - update.date <= (MILLISECONDS_IN_30_DAYS));

    const roleChange = helpers.getElementAddedOrRemovedFromTwoArrays(helpers.getAllRolesOfMember(oldMember).map(role => role.id), helpers.getAllRolesOfMember(newMember).map(role => role.id));

    oldRoleUpdates.push({ role: roleChange.element, change: roleChange.change, memberId: newMember.id, date: Date.now() });
    client.roleUpdates.set(newMember.id, oldRoleUpdates);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!approvedGuilds.some(guildId => guildId === interaction.guildId)) {
    return;
  }

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(error);
      await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
    }
  } else if (interaction.isStringSelectMenu()) {
    await require("./handleStringSelectMenuInteraction").execute(interaction);
  } else if (interaction.isModalSubmit()) {
    await require("./handleModalSubmitInteraction").execute(interaction);
  } else if (interaction.isAutocomplete()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      logger.error(error);
    }
  }

  if (interaction.isButton()) {
    require("./handleButtonPress").execute(interaction);
  }
});

client.on(Events.MessageCreate, async message => {
  if (message.inGuild()) {
    if (!approvedGuilds.some(guildId => guildId === message.guildId)) {
      return;
    }
    
    if (await helpers.getChannelById(message.guild, client.settings.get(message.guild.id, "voyageLogbookChannelId"))) {
      if (message.channel.id === (client.settings.get(message.guild.id, "voyageLogbookChannelId"))) {
        await helpers.cacheAllOfficialVoyageCounts(await helpers.getChannelById(message.guild, client.settings.get(message.guild.id, "voyageLogbookChannelId")));
      }
    }
  }
});

client.on("error", async error => {
  for (const id of DEVELOPER_IDS) {
    (await client.users.createDM(id)).send(
      `~~===========================================================================================~~
The bot has crashed! Error:
\`\`\`json
${error.name}: ${error.message}
\`\`\`
Stack Trace: 
\`\`\`json
${error.stack}
\`\`\`
`);
  }
});

function loginBot() {
  logger.info("-------------------Logging in-------------------");
  client.login(parsed.TOKEN);
  voyageHostingChecker.startVoyageHostingChecker(client);
}

module.exports = {
  client,
  loginBot
};
