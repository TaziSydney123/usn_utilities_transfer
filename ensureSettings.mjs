import Enmap from "enmap";

import inquirer from 'inquirer';

const settings = new Enmap({
  name: "settings",
  fetchAll: true,
  autoFetch: true,
  cloneLevel: 'deep'
});

const ensureSettings = {
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
  civilianRoleId: "",
  juniorEnlistedRoleId: "",
  E1RoleId: "",
  trainingScheduleChannelId: "",
  recruitBarracksChannelId: "",
  logisticsHeadId: "",
  maxDaysWithoutHosting: "14"
};

const guildIdQuestions = [
  {
    type: 'list',
    name: 'guildId',
    message: "What guild do you want to ensure settings on?\n> ",
    choices: settings.keyArray()
  },
];

inquirer.prompt(guildIdQuestions).then(input => {
  ensureSettingsOnGuild(input.guildId);
});

function ensureSettingsOnGuild(guildId) {
  const settingsAdded = [];
  for (const setting of Object.keys(ensureSettings)) {
    if (!settings.has(guildId, setting)) {
      settings.set(guildId, ensureSettings[setting], setting);
      settingsAdded.push(setting);
    }
  }
  console.log("Added " + settingsAdded.length + " settings" + (settingsAdded.length > 0 ? ":\n" + settingsAdded.map(setting => "- " + setting).join("\n") : ""));
}