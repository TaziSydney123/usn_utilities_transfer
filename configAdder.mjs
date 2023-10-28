import Enmap from "enmap";

import inquirer from 'inquirer';

const settings = new Enmap({
  name: "settings",
  fetchAll: true,
  autoFetch: true,
  cloneLevel: 'deep'
});

const guildIdQuestions = [
  {
    type: 'list',
    name: 'guildId',
    message: "What guild do you want to edit?\n> ",
    choices: settings.keyArray()
  },
];

inquirer.prompt(guildIdQuestions).then(input => {
  askEnmap(input.guildId);
});

function askEnmap(guildId) {
  inquirer.prompt([
    {
      type: 'input',
      name: 'path',
      message: "What do you want to add?\n> ",
    },
  ]).then(input => {

    const path = input.path;

    inquirer.prompt([
      {
        type: 'input',
        name: 'starter',
        message: "Enter starter value:\n> ",
      },
    ]).then(input => {
      settings.set(guildId, JSON.parse(input.starter), path);
      askEnmap(guildId);
    });
  });
}
