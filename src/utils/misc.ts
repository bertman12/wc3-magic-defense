import { Effect, MapPlayer, Timer, Unit } from "w3ts";
import { playerHexColorMap } from "./color";

type ProperColors = "goldenrod" | "magenta" | "green" | "yellow" | "red" | "player1-red" | "player2-blue" | "player3-teal" | "player4-purple" | "player5-yellow" | "player6-orange";

export function tColor(text: string | number, color?: ProperColors, hex?: string, alpha?: string) {
    if (color) {
        return `|cff${properColorHexes.get(color) || "FFFFFF"}${alpha || ""}${text}|r`;
    } else if (hex) {
        return `|cff${hex}${alpha || ""}${text}|r`;
    }

    return String(text);
}

/**
 * Colorizes the string according to the map player
 */
export function ptColor(player: MapPlayer, text: string) {
    return `${tColor(text, undefined, playerHexColorMap.get(player.id))}`;
}

const properColorHexes = new Map<ProperColors, string>([
    ["goldenrod", "E0A526"],
    ["green", "00FF00"],
    ["yellow", "FFFF00"],
    ["red", "FF0000"],
    ["magenta", "FF00FF"],
    ["player1-red", "ff0303"],
    ["player2-blue", "0042ff"],
    ["player3-teal", "1ce6b9"],
    ["player4-purple", "540081"],
    ["player5-yellow", "fffc00"],
    ["player6-orange", "fe8a0e"],
]);

/**
 * Standardized format for notifying player of events.
 */
export function notifyPlayer(msg: string) {
    print(`${tColor("!", "goldenrod")} - ${msg}`);
}

/**
 * Returns degrees or radians?
 */
export function getRelativeAngleToUnit(unit: Unit, relativeUnit: Unit) {
    const locA = GetUnitLoc(unit.handle);
    const locB = GetUnitLoc(relativeUnit.handle);

    return AngleBetweenPoints(locA, locB);
}

/**
 * Manages state of effects in this context so you don't have to!
 */
export function useEffects() {
    const effects: Effect[] = [];

    return {
        addEffect: (effect: Effect | undefined) => {
            if (effect) {
                effects.push(effect);
            }
        },
        /**
         * @returns reference to effects array
         */
        getEffects: () => {
            return effects;
        },
        destroyAllEffects: () => {
            effects.forEach((e) => {
                e.destroy();
            });
        },
    };
}

export function useTempEffect(effect: Effect | undefined, duration: number = 1.5) {
    if (effect) {
        const timer = Timer.create();

        timer.start(duration, false, () => {
            effect.destroy();
            timer.destroy();
        });
    }
}
