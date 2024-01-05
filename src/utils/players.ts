import { Group, MapPlayer, Rectangle, Unit } from "w3ts";
import { Players } from "w3ts/globals";

/**
 * Does a callback for every unit of the player that has the ability
 * @param player
 * @param abilityId
 * @param cb
 */
export function forEachUnitOfPlayerWithAbility(player: MapPlayer, abilityId: number, cb: (unit: Unit) => void) {
    forEachUnitOfPlayer(player, (u) => {
        for (let x = 0; x < 12; x++) {
            const currentAbility = u.getAbilityByIndex(x);

            if (currentAbility && currentAbility === u.getAbility(abilityId) && u.isAlive()) {
                cb(u);
            }
        }
    });
}

export function forEachPlayer(cb: (player: MapPlayer, index?: number) => void) {
    Players.forEach((p, index) => {
        cb(p, index);
    });
}

/**
 * Executes the callback function for each unit matching the unit type for the player
 * @param unitType Unit Type Id or the Unit Type String "hcas", etc
 */
export function forEachUnitTypeOfPlayer(unitType: number | string, player: MapPlayer, cb: (unit: Unit) => void) {
    if (typeof unitType === "string") {
        unitType = FourCC(unitType);
    }

    const g = Group.create();

    g?.enumUnitsOfPlayer(player, () => {
        const unit = Group.getFilterUnit();

        if (unit && unit?.typeId === unitType) {
            cb(unit);
        }

        return true;
    });

    g?.destroy();
}

/**
 * @param unitType Unit Type Id or the Unit Type String "hcas", etc
 */
export function forEachUnitOfPlayer(player: MapPlayer, cb: (unit: Unit) => void) {
    const g = Group.create();

    g?.enumUnitsOfPlayer(player, () => {
        const unit = Group.getFilterUnit();

        if (!unit) {
            print("Enumerating over a unit that doesn't exist!");
        }
        if (unit) {
            cb(unit);
        }

        return true;
    });

    g?.destroy();
}

/**
 * Executes the callback function for each unit matching the unit type for the player
 * @param unitType Unit Type Id or the Unit Type String "hcas", etc
 */
export function forEachUnitInRectangle(rectangle: Rectangle, cb: (unit: Unit) => void) {
    const g = Group.create();

    g?.enumUnitsInRect(rectangle, () => {
        const unit = Group.getFilterUnit();

        if (unit) {
            cb(unit);
        }

        return true;
    });

    g?.destroy();
}

export function isPlaying(player: MapPlayer | player) {
    if (player instanceof MapPlayer) {
        return player.slotState === PLAYER_SLOT_STATE_PLAYING;
    }

    return GetPlayerSlotState(player) === PLAYER_SLOT_STATE_PLAYING;
}

export function isUser(player: MapPlayer | player) {
    if (player instanceof MapPlayer) {
        return GetPlayerController(player.handle) === MAP_CONTROL_USER;
    }

    return GetPlayerController(player) === MAP_CONTROL_USER;
}

export function isComputer(player: MapPlayer) {
    if (player instanceof MapPlayer) {
        return GetPlayerController(player.handle) === MAP_CONTROL_COMPUTER;
    }

    return GetPlayerController(player) === MAP_CONTROL_COMPUTER;
}

export function isPlayingUser(player: MapPlayer | player) {
    return isUser(player) && isPlaying(player);
}

export function adjustPlayerState(player: MapPlayer, whichState: playerstate, amount: number) {
    player.setState(whichState, player.getState(whichState) + amount);
}

export function adjustGold(player: MapPlayer, amount: number) {
    player.setState(PLAYER_STATE_RESOURCE_GOLD, player.getState(PLAYER_STATE_RESOURCE_GOLD) + amount);
}

export function adjustLumber(player: MapPlayer, amount: number) {
    player.setState(PLAYER_STATE_RESOURCE_LUMBER, player.getState(PLAYER_STATE_RESOURCE_LUMBER) + amount);
}

export function adjustFoodCap(player: MapPlayer, amount: number) {
    player.setState(PLAYER_STATE_RESOURCE_FOOD_CAP, player.getState(PLAYER_STATE_RESOURCE_FOOD_CAP) + amount);
}

export function adjustFoodUsed(player: MapPlayer, amount: number) {
    player.setState(PLAYER_STATE_RESOURCE_FOOD_USED, player.getState(PLAYER_STATE_RESOURCE_FOOD_USED) + amount);
}
