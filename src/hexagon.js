export const FIELDTYPE = {
  GREEN: 0,
  HILL: 1,
  MOUNTAIN: 2,
  RIVER: 3,
  WATER: 4,
  MERGED_RIVER: 5,
  FOUNTAIN: 6,
  LAKE: 7,
  HILL_RIVER: 8,
  HILL_LAKE: 9,
  HILL_RIVER_MERGE: 10
};

export const HEXAGON_SIZE = {
  HEIGHT: 50,
  WIDTH: 50
};

export default class Hexagon {
  constructor(posx, posy, type, rowIndex, colIndex, game) {
    this.game = game;
    this.population = 0;

    if (type === FIELDTYPE.MOUNTAIN) {
      this.waterPower = 3;
      this.fountains = [this];
    } else {
      this.waterPower = 0;
      this.fountains = [];
    }

    this.civilization = null;
    this.child = null;

    this.rowIndex = rowIndex;
    this.colIndex = colIndex;
    this.neighbours = [];
    this.isSelected = false;
    this.type = type;

    this.initImage();

    this.position = { x: posx, y: posy };
    this.width = HEXAGON_SIZE.WIDTH;
    this.height = HEXAGON_SIZE.HEIGHT;
    this.boundingBoxLeftUpper = { x: posx, y: posy };
    this.boundingBoxRightLower = {
      x: posx + this.width,
      y: posy + this.height
    };
  }

  initImage() {
    this.imageName = "";
    switch (this.type) {
      case FIELDTYPE.GREEN:
        this.imageName = "greenImage";
        break;
      case FIELDTYPE.HILL:
        this.imageName = "hillImage";
        break;
      case FIELDTYPE.MOUNTAIN:
        this.imageName = "mountainImage";
        break;
      case FIELDTYPE.RIVER:
        this.imageName = "riverImage";
        break;
      case FIELDTYPE.WATER:
        this.imageName = "waterImage";
        break;
      case FIELDTYPE.MERGED_RIVER:
        this.imageName = "riverMergeImage";
        break;
      case FIELDTYPE.FOUNTAIN:
        this.imageName = "fountainImage";
        break;
      case FIELDTYPE.LAKE:
        this.imageName = "lakeImage";
        break;
      case FIELDTYPE.HILL_RIVER:
        this.imageName = "hillRiverImage";
        break;
      case FIELDTYPE.HILL_LAKE:
        this.imageName = "hillLakeImage";
        break;
      case FIELDTYPE.HILL_RIVER_MERGE:
        this.imageName = "hillRiverMergeImage";
        break;
      default:
        this.imageName = "greenImage";
    }
    this.image = document.getElementById(this.imageName);
  }

  update(deltaTime) {
    if (this.isSelected) {
      this.image = document.getElementById(this.imageName + "_selected");
    } else {
      this.image = document.getElementById(this.imageName);
    }

    if (this.type === FIELDTYPE.GREEN || this.type === FIELDTYPE.HILL) {
      let riverNeighbours = this.neighbours.filter(
        neighbour => neighbour.type === FIELDTYPE.RIVER
      );
      let growthRate = this.type === FIELDTYPE.GREEN ? 1.2 : 1.1;
      let populationToAdd = riverNeighbours.length * growthRate;
      this.population += populationToAdd / 50;
    }
  }

  calcProjectedRectSizeOfRotatedRect(size, rad) {
    const { width, height } = size;
    const rectProjectedWidth =
      Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad));
    const rectProjectedHeight =
      Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad));
    return { width: rectProjectedWidth, height: rectProjectedHeight };
  }

  draw(ctx) {
    ctx.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );

    ctx.fillStyle = "#f00";

    if (this.waterPower > 0) {
      ctx.font = "10px Arial";
      ctx.fillStyle = "aqua";
      ctx.textAlign = "center";
      ctx.fillText(
        Math.floor(this.waterPower),
        this.position.x + this.width / 2,
        this.position.y + (this.height / 3) * 2
      );
    }

    if (this.population === 0) return;

    if (!this.civilization) {
      ctx.font = "10px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(
        Math.floor(this.population),
        this.position.x + this.width / 3,
        this.position.y + this.height / 3
      );
    } else {
      if (this.civilization.centerHexagon === this) {
        ctx.font = "10px Arial";
        ctx.fillStyle = "yellow";
        ctx.textAlign = "center";
        ctx.fillText(
          Math.floor(this.civilization.population),
          this.position.x + this.width / 3,
          this.position.y + this.height / 3
        );
      }
    }
  }
}
