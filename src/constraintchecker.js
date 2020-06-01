import { FIELDTYPE } from "./hexagon";

export default class ConstraintChecker {
  checkElevationForNextRiverField(
    selectedHexagon,
    selectedFieldToSpawnIsNeighbour
  ) {
    console.log("selectedHexagon === ", selectedHexagon.type);
    console.log(
      "selectedFieldToTurn === ",
      selectedFieldToSpawnIsNeighbour.type
    );

    if (selectedFieldToSpawnIsNeighbour.type === FIELDTYPE.FOUNTAIN) {
      return false;
    }

    switch (selectedHexagon.type) {
      case FIELDTYPE.MOUNTAIN:
        return true;
      case FIELDTYPE.HILL:
      case FIELDTYPE.HILL_RIVER:
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

  fountainPowerCheck(selectedHexagon) {
    let fountainDistance = 0;
    let cursor = selectedHexagon;
    while (cursor.parent) {
      fountainDistance++;
      cursor = cursor.parent;
    }
    return fountainDistance < 3;
  }
}
