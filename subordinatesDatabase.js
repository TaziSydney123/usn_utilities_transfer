const helpers = require("./helpers");
const logger = require("./logger");

class SubordinatesDatabase {
  constructor(interaction) {
    this.guild = interaction.guild;
    this.guildId = this.guild.id;
    this.client = interaction.client;
  }

  getActingFor(actingSuperior) {
    for (const [superior, actingSuperiorId] of this.client.actingSuperiors) {
      if (actingSuperiorId === actingSuperior) {
        return superior;
      }
    }

    return null;
  }

  memberHasActingSuperior(superiorId) {
    if (superiorId) {
      return this.client.actingSuperiors.has(superiorId);
    }
  }

  async setSubordinatesToSuperior(superiorId, subordinatesInput) {
    const nullIds = []; // Names that do not exist
    const takenIds = []; // Members with an existing CO

    try {
      const subordinateIds = [];

      for (const subordinateNameAndId of subordinatesInput) {
        const nameAndId = subordinateNameAndId.split(" -- ");
        const firstInput = nameAndId[0];

        if (firstInput.length > 0) {
          const id = nameAndId.length > 1 ? nameAndId[1] : (firstInput.match(/^\d*$/) ? firstInput : null);

          let memberFromId;

          if (await helpers.memberIdExists(this.guild, id)) {
            memberFromId = await this.guild.members.fetch(id);
          }

          const member = memberFromId ? memberFromId : await helpers.getMemberFromUsername(this.guild, firstInput);
          if (!member) {
            nullIds.push(firstInput);
            continue;
          }

          if (!subordinateIds.includes(member.id)) {
            if (!member) {
              nullIds.push(firstInput);
              continue;
            }

            const existingSuperiorId = await this.getSuperior(member.id);
            if (existingSuperiorId !== null && await this.getSuperior(member.id) !== superiorId) {
              takenIds.push(firstInput);
              continue;
            }

            subordinateIds.push(member.id);
          }
        }
      }

      this.client.subordinates.set(superiorId, subordinateIds);
    } catch (error) {
      logger.error("error setting subordiates:\n" + error);
    }

    return { nullIds, takenIds };
  }

  setActingSuperior(superior, actingSuperior) {
    if (actingSuperior === superior) {
      return {
        success: false,
        error: "set_to_self"
      };
    }

    for (const actingId of this.client.actingSuperiors.values()) {
      if (actingId === actingSuperior) {
        return {
          success: false,
          error: "member_taken",
          info: this.getActingFor(actingId)
        };
      }
    }

    if (this.client.actingSuperiors.has(superior)) {
      return {
        success: false,
        error: "already_set"
      };
    }

    if (actingSuperior) {
      this.client.actingSuperiors.set(superior, actingSuperior);
    } else {
      this.client.actingSuperiors.delete(superior);
    }

    return { success: true };
  }

  getNonActingSubordinatesOfSuperior(superiorId) {
    if (!this.client.subordinates.has(superiorId)) {
      return [];
    }

    return this.client.subordinates.get(superiorId);
  }

  getAllSubordinatesOfSuperior(superiorId) {
    let subordinates = [];
    if (this.getActingFor(superiorId)) {
      let newSubordinates = this.getNonActingSubordinatesOfSuperior(this.getActingFor(superiorId));
      newSubordinates = newSubordinates.filter(subordinate => subordinate !== superiorId);
      subordinates = newSubordinates;
    }

    if (this.client.actingSuperiors.has(superiorId)) {
      subordinates = subordinates.concat(this.client.actingSuperiors.get(superiorId));
    }

    if (subordinates.length === 0) {
      subordinates = this.getNonActingSubordinatesOfSuperior(superiorId);
    }

    return subordinates;
  }

  getNonActingSuperior(subordinateId) {
    for (const [superior, subordinateIds] of this.client.subordinates) {
      if (subordinateIds.includes(subordinateId)) {
        const superiorId = superior;
        return superiorId;
      }
    }

    return null;
  }

  removeSubordinateReference(subordinateId) {
    if (!subordinateId) {
      return;
    }

    if (!this.getNonActingSuperior(subordinateId)) {
      return;
    }

    if (!this.client.subordinates.has(this.getNonActingSuperior(subordinateId))) {
      return;
    }

    this.client.subordinates.remove(this.getNonActingSuperior(subordinateId), subordinateId);
  }

  async getSuperior(subordinateId) {
    if (this.memberHasActingSuperior(this.getNonActingSuperior(subordinateId))) {
      if (subordinateId === this.client.actingSuperiors.get(this.getNonActingSuperior(subordinateId))) {
        let currentCOStep = this.getNonActingSuperior(subordinateId);
        while ((await this.guild.members.fetch(currentCOStep)).displayName.match(/^ *\[ *LOA-\d *\] */gm)) {
          currentCOStep = this.getNonActingSuperior(currentCOStep);
        }

        return currentCOStep;
      }

      return this.client.actingSuperiors.get(this.getNonActingSuperior(subordinateId));
    }

    if (this.getNonActingSuperior(subordinateId)) {
      return this.getNonActingSuperior(subordinateId);
    }

    return null;
  }

  clearSubordinates(superiorId) {
    const clearedSubordinates = this.getNonActingSubordinatesOfSuperior(superiorId);
    this.client.subordinates.delete(superiorId);
    return clearedSubordinates;
  }

  reclaimSubordinates(superiorId) {
    if (this.client.actingSuperiors.has(superiorId)) {
      this.client.actingSuperiors.delete(superiorId);
      return true;
    }
  }

  transferSubordinates(from, to) {
    if (this.client.subordinates.has(from)) {
      const subordinatesToTransfer = this.getNonActingSubordinatesOfSuperior(from);

      const indexOfTo = subordinatesToTransfer.indexOf(to);

      if (indexOfTo > -1) {
        subordinatesToTransfer.splice(indexOfTo, 1);
      }

      if (this.client.subordinates.has(to)) {
        this.client.subordinates.push(to, subordinatesToTransfer);
      } else {
        this.client.subordinates.set(to, subordinatesToTransfer);
      }

      this.clearSubordinates(from);
      return {
        success: true
      };
    }

    return {
      success: false,
      reason: "no_subordinates"
    };
  }
}

module.exports = {
  SubordinatesDatabase
};