import Hexagon from "./hexagon";
import { FIELDTYPE, HEXAGON_SIZE } from "./hexagon";
import InputHandler from "./input";
import Civilization from "./civilization";
import ConstraintChecker from "./constraintchecker";

export const GAME_STATE = {
  SELECT_MODE: 0,
  SPAWN_RIVER_MODE: 1
};

const ROW_SIZE = 10;
const MAX_WATER_FIELD_COUNT = 10;
const CIVILIZATION_LIMIT = 20;

export default class Game {
  constructor(gameWidth, gameHeight) {
    this.menuCanvas = document.getElementById("menuScreen");

    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;

    this.gamestate = GAME_STATE.SELECT_MODE;

    this.hexagons = [];
    this.initHexagons();
    this.determineNeighbours();

    this.constraintChecker = new ConstraintChecker(this);

    new InputHandler(this);
  }

  initHexagons() {
    let colCount = 0;
    let rowCount = 0;
    let colCountOffset = 0;

    let waterLine = {
      x: Math.floor(Math.random() * this.gameWidth),
      y: Math.floor(Math.random() * this.gameHeight)
    };

    let waterFieldCount = 0;
    for (let i = 1; i < 100; i++) {
      let keys = Object.keys(FIELDTYPE);
      keys = keys.filter(
        entry =>
          entry !== "WATER" &&
          entry !== "RIVER" &&
          entry !== "MERGED_RIVER" &&
          entry !== "FOUNTAIN" &&
          entry !== "LAKE" &&
          entry !== "HILL_RIVER" &&
          entry !== "HILL_LAKE" &&
          entry !== "HILL_RIVER_MERGE"
      );

      keys.push("GREEN"); // add one more green to bias the random towards green
      keys.push("GREEN"); // add one more green to bias the random towards green

      const randIndex = Math.floor(Math.random() * keys.length);
      const randKey = keys[randIndex];
      const type = FIELDTYPE[randKey];

      let hexagonX = HEXAGON_SIZE.WIDTH * colCount + colCountOffset;
      let hexagonY = (HEXAGON_SIZE.HEIGHT - HEXAGON_SIZE.HEIGHT / 4) * rowCount;

      if (
        waterFieldCount < MAX_WATER_FIELD_COUNT &&
        hexagonX < waterLine.x &&
        hexagonY < waterLine.y
      ) {
        type = FIELDTYPE.WATER;
        waterFieldCount++;
      }

      let hex = new Hexagon(hexagonX, hexagonY, type, rowCount, colCount);
      this.hexagons.push(hex);
      colCount++;
      if (i != 0 && i % ROW_SIZE === 0) {
        colCount = 0;
        colCountOffset === 0
          ? (colCountOffset = HEXAGON_SIZE.WIDTH / 2)
          : (colCountOffset = 0);
        rowCount++;
      }
    }
  }

  determineNeighbours() {
    for (let i = 0; i < this.hexagons.length; i++) {
      let hex = this.hexagons[i];

      let nextRowNeighbourIndexOffset = hex.rowIndex % 2 === 0 ? -1 : 1;

      let neighbours = this.hexagons.filter(
        p =>
          (p.rowIndex === hex.rowIndex && p.colIndex === hex.colIndex - 1) ||
          (p.rowIndex === hex.rowIndex && p.colIndex === hex.colIndex + 1) ||
          (p.rowIndex === hex.rowIndex - 1 && p.colIndex === hex.colIndex) ||
          (p.rowIndex === hex.rowIndex - 1 &&
            p.colIndex === hex.colIndex + nextRowNeighbourIndexOffset) ||
          (p.rowIndex === hex.rowIndex + 1 && p.colIndex === hex.colIndex) ||
          (p.rowIndex === hex.rowIndex + 1 &&
            p.colIndex === hex.colIndex + nextRowNeighbourIndexOffset)
      );
      hex.neighbours = neighbours;
    }
  }

  update(deltaTime) {
    this.hexagons.forEach(hex => {
      hex.update(deltaTime);

      /*
      let populationSum = hex.population;
      hex.neighbours.forEach(
        neighbour => (populationSum += neighbour.population)
      );

      if (hex.civilization && hex.civilization.centerHexagon === hex) {
        hex.civilization.population = populationSum;
      } else if (!hex.civilization) {
        if (populationSum > CIVILIZATION_LIMIT) {
          let civilization = new Civilization(hex, populationSum);
          hex.civilization = civilization;
          hex.neighbours.forEach(
            neighbour => (neighbour.civilization = civilization)
          );
        }
      }
      */
    });
  }

  draw(ctx) {
    ctx.clearRect(this.submenuX, this.submenuY, 100, 100);
    this.hexagons.forEach(obj => obj.draw(ctx));
  }

  spawnRiver() {
    let selectedHexagons = this.hexagons.filter(hex => hex.isSelected === true);
    let selectedHexagon = selectedHexagons[0];
    if (!selectedHexagon) return;
    if (
      selectedHexagon.type === FIELDTYPE.MOUNTAIN ||
      selectedHexagon.type === FIELDTYPE.RIVER ||
      selectedHexagon.type === FIELDTYPE.MERGED_RIVER ||
      selectedHexagon.type === FIELDTYPE.HILL_RIVER ||
      selectedHexagon.type === FIELDTYPE.HILL_RIVER_MERGE
    ) {
      this.gamestate = GAME_STATE.SPAWN_RIVER_MODE;
    }
  }

  handleMouseClick(hexagonToTurnToRiver) {
    if (this.gamestate === GAME_STATE.SELECT_MODE) {
      hexagonToTurnToRiver.isSelected = true;
      console.log(hexagonToTurnToRiver.fountains);
    }

    if (this.gamestate === GAME_STATE.SPAWN_RIVER_MODE) {
      let selectedHexagons = this.hexagons.filter(
        hex => hex.isSelected === true
      );
      let selectedHexagon = selectedHexagons[0];

      let selectedFieldToSpawnIsNeighbour = selectedHexagon.neighbours.includes(
        hexagonToTurnToRiver
      );

      let hasAlreadyRiver =
        selectedHexagon.type === FIELDTYPE.MOUNTAIN &&
        this.hexagons.filter(hex => hex.parent === selectedHexagon).length > 0;

      let elevationForNewHexIsLessThanCurrentHexagon = this.constraintChecker.checkElevationForNextRiverField(
        selectedHexagon,
        hexagonToTurnToRiver
      );

      let fountainHasPower = this.constraintChecker.fountainPowerCheck(
        selectedHexagon
      );

      let hexagonToTurnHasSameParent = this.constraintChecker.checkIfBothHaveSameParent(
        selectedHexagon,
        hexagonToTurnToRiver
      );

      /*
      console.log("elevationOk: " + elevationForNewHexIsLessThanCurrentHexagon);
      console.log("fountain has power: " + fountainHasPower);
      console.log("!hasAlreadyRiver: " + !hasAlreadyRiver);
      console.log(
        "selectedFieldToSpawnIsNeighbour: " + selectedFieldToSpawnIsNeighbour
      );
      */

      if (
        elevationForNewHexIsLessThanCurrentHexagon &&
        fountainHasPower &&
        !hasAlreadyRiver &&
        !hexagonToTurnHasSameParent &&
        selectedFieldToSpawnIsNeighbour &&
        !selectedHexagon.child
      ) {
        if (selectedHexagon.type === FIELDTYPE.MOUNTAIN) {
          selectedHexagon.type = FIELDTYPE.FOUNTAIN;
          selectedHexagon.initImage();
        }

        switch (hexagonToTurnToRiver.type) {
          case FIELDTYPE.GREEN:
            hexagonToTurnToRiver.type = FIELDTYPE.RIVER;
            break;
          case FIELDTYPE.HILL_RIVER || FIELDTYPE.HILL_LAKE:
            hexagonToTurnToRiver.type = FIELDTYPE.HILL_RIVER_MERGE;
            break;
          case FIELDTYPE.RIVER:
          case FIELDTYPE.LAKE:
            hexagonToTurnToRiver.type = FIELDTYPE.MERGED_RIVER;
            break;
          case FIELDTYPE.HILL:
            hexagonToTurnToRiver.type = FIELDTYPE.HILL_RIVER;
            break;

          default:
            break;
        }

        let cursor = hexagonToTurnToRiver;
        while (cursor) {
          cursor.fountains.push(...selectedHexagon.fountains);
          cursor = cursor.child;
        }

        for (let fountain of hexagonToTurnToRiver.fountains) {
          if (fountain.waterPower > 0) {
            fountain.waterPower--;
            break;
          }
        }

        let hasWaterPower = this.constraintChecker.fountainPowerCheck(
          hexagonToTurnToRiver
        );
        hexagonToTurnToRiver.parent = selectedHexagon;
        selectedHexagon.child = hexagonToTurnToRiver;

        /*
        if (!hasWaterPower) {
          if (hexagonToTurnToRiver.type === FIELDTYPE.RIVER) {
            hexagonToTurnToRiver.type = FIELDTYPE.LAKE;
          }
          if (hexagonToTurnToRiver.type === FIELDTYPE.HILL_RIVER) {
            hexagonToTurnToRiver.type = FIELDTYPE.HILL_LAKE;
          }
        }
        */

        /*
        let parentCount = 0;
        let cursor = hexagonToTurnToRiver;
        while (cursor.parent) {
          cursor = cursor.parent;
          parentCount++;
        }
        if (parentCount >= 3) {
          if (hexagonToTurnToRiver.type === FIELDTYPE.RIVER) {
            hexagonToTurnToRiver.type = FIELDTYPE.LAKE;
          }
          if (hexagonToTurnToRiver.type === FIELDTYPE.HILL_RIVER) {
            hexagonToTurnToRiver.type = FIELDTYPE.HILL_LAKE;
          }
        }
        */
      }

      hexagonToTurnToRiver.initImage();

      this.gamestate = GAME_STATE.SELECT_MODE;
    }
  }
}
