import { FIELDTYPE } from "./hexagon";

export default class ConstraintChecker {
  constructor(game) {
    this.game = game;
  }

  checkIfBothHaveSameParent(selectedHexagon, fieldToChange) {
    let selectedHexagonParents = [];
    let fieldToChangeParents = [];

    let cursor = selectedHexagon;
    while (cursor.parent) {
      selectedHexagonParents.push(cursor.parent);
      cursor = cursor.parent;
    }
    console.log(selectedHexagonParents);

    cursor = fieldToChange;
    while (cursor.parent) {
      fieldToChangeParents.push(cursor.parent);
      cursor = cursor.parent;
    }
    console.log(fieldToChangeParents);

    const found =
      selectedHexagonParents.some(value =>
        fieldToChangeParents.includes(value)
      ) ||
      fieldToChangeParents.some(value =>
        selectedHexagonParents.includes(value)
      );

    if (found) {
      return true;
    }
    return false;
  }

  checkElevationForNextRiverField(selectedHexagon, fieldToChange) {
    if (fieldToChange.type === FIELDTYPE.FOUNTAIN) {
      return false;
    }

    switch (selectedHexagon.type) {
      case FIELDTYPE.MOUNTAIN:
        return true;
      case FIELDTYPE.HILL:
      case FIELDTYPE.HILL_RIVER:
      case FIELDTYPE.HILL_RIVER_MERGE:
        return fieldToChange.type !== FIELDTYPE.MOUNTAIN;
      case FIELDTYPE.GREEN:
      case FIELDTYPE.RIVER:
      case FIELDTYPE.MERGED_RIVER:
      case FIELDTYPE.WATER:
        return (
          fieldToChange.type !== FIELDTYPE.MOUNTAIN &&
          fieldToChange.type !== FIELDTYPE.HILL &&
          fieldToChange.type !== FIELDTYPE.HILL_RIVER
        );
      default:
        return false;
    }
  }

  fountainPowerCheck(selectedHexagon) {
    let cursor = selectedHexagon;
    while (cursor.parent) {
      cursor = cursor.parent;
    }
    let fountainDistance = 0;
    while (cursor.child) {
      cursor = cursor.child;
      fountainDistance++;
    }
    if (fountainDistance >= 3) {
      return false;
    }

    return true;
  }
}
