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
      type: 'list',
      name: 'path',
      message: "What do you want to edit?\n> ",
      choices: Object.keys(settings.get(guildId))
    },
  ]).then(input => {
    console.log(settings.has(guildId, input.path) ? settings.get(guildId, input.path) : "That doesn't exist!\n\n\n");

    const path = input.path;

    inquirer.prompt([
      {
        type: 'confirm',
        name: 'edit',
        message: "Edit this? (" + settings.get(guildId, path) + ")",
      },
    ]).then(input => {
      if (input.edit) {
        inquirer.prompt([
          {
            type: 'input',
            name: 'new',
            message: "Enter new value:\n> ",
          },
        ]).then(input => {
          settings.set(guildId, JSON.parse(input.new), path);
          askEnmap(guildId);
        });
      } else {
        askEnmap(guildId);
      }
    });


    
  });
}
