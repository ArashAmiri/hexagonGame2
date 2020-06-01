import Hexagon from "./hexagon";
import { FIELDTYPE, HEXAGON_SIZE } from "./hexagon";
import InputHandler from "./input";
import Civilization from "./civilization";

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
          entry !== "WATER" && entry !== "RIVER" && entry !== "MERGED_RIVER"
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
      selectedHexagon.type === FIELDTYPE.RIVER
    ) {
      this.gamestate = GAME_STATE.SPAWN_RIVER_MODE;
    }
  }

  handleMouseClick(hexagonToTurnToRiver) {
    if (this.gamestate === GAME_STATE.SELECT_MODE) {
      hexagonToTurnToRiver.isSelected = true;
    }

    if (this.gamestate === GAME_STATE.SPAWN_RIVER_MODE) {
      let selectedHexagons = this.hexagons.filter(
        hex => hex.isSelected === true
      );
      let selectedHexagon = selectedHexagons[0];

      let selectedFieldToSpawnIsNeighbour = selectedHexagon.neighbours.includes(
        hexagonToTurnToRiver
      );
      let hasAlreadyRiverAndIsAMountain =
        selectedHexagon.type === FIELDTYPE.MOUNTAIN &&
        selectedHexagon.neighbours.filter(hex => hex.type === FIELDTYPE.RIVER)
          .length > 0;

      let selectedHexagonIsAlreadyParentOfAnother =
        this.hexagons.filter(hex => hex.parent === selectedHexagon).length > 0;

      let fountainDistance = 0;
      let cursor = selectedHexagon;
      while (cursor.parent) {
        fountainDistance++;
        cursor = cursor.parent;
      }

      let elevationForNewHexIsLessThanCurrentHexagon = this.checkElevationForNextRiverField(
        selectedHexagon,
        hexagonToTurnToRiver
      );

      let fountainHasPower = fountainDistance < 3;

      if (
        elevationForNewHexIsLessThanCurrentHexagon &&
        fountainHasPower &&
        !hasAlreadyRiverAndIsAMountain &&
        selectedFieldToSpawnIsNeighbour &&
        !selectedHexagonIsAlreadyParentOfAnother
      ) {
        if (hexagonToTurnToRiver.type === FIELDTYPE.RIVER) {
          hexagonToTurnToRiver.type = FIELDTYPE.MERGED_RIVER;
        } else {
          hexagonToTurnToRiver.type = FIELDTYPE.RIVER;
        }
        hexagonToTurnToRiver.parent = selectedHexagon;
        hexagonToTurnToRiver.initImage();
      }
      this.gamestate = GAME_STATE.SELECT_MODE;
    }
  }

  checkElevationForNextRiverField(
    selectedHexagon,
    selectedFieldToSpawnIsNeighbour
  ) {
    console.log("selectedHexagon === ", selectedHexagon.type);
    console.log(
      "selectedFieldToTurn === ",
      selectedFieldToSpawnIsNeighbour.type
    );

    switch (selectedHexagon.type) {
      case FIELDTYPE.MOUNTAIN:
        return true;
      case FIELDTYPE.HILL:
        return selectedFieldToSpawnIsNeighbour.type !== FIELDTYPE.MOUNTAIN;
      case FIELDTYPE.GREEN:
      case FIELDTYPE.RIVER:
      case FIELDTYPE.MERGED_RIVER:
      case FIELDTYPE.WATER:
        return (
          selectedFieldToSpawnIsNeighbour.type !== FIELDTYPE.MOUNTAIN &&
          selectedFieldToSpawnIsNeighbour.type !== FIELDTYPE.HILL
        );
      default:
        return false;
    }
  }
}
