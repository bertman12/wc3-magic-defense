import { UNITS } from "src/shared/enums";
import {
  adjustFoodCap,
  adjustGold,
  adjustLumber,
  forEachPlayer,
  isPlayingUser,
} from "src/utils/players";
import { Unit } from "w3ts";

export function setup_createHero() {
  forEachPlayer((p) => {
    if (isPlayingUser(p)) {
      Unit.create(p, UNITS.playerHero, 0, 0);

      //For testing
      adjustGold(p, 10000);
      adjustLumber(p, 10000);
      adjustFoodCap(p, 100);
    }
  });
}
