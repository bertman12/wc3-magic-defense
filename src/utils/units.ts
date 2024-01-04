import { Unit } from "w3ts";

export function createUnits(quantity: number, useFood: boolean, ...args: Parameters<typeof Unit.create>) {
    const units: Unit[] = [];
    for (let x = 0; x < quantity; x++) {
        const u = Unit.create(...args);

        if (u) {
            u.setUseFood(useFood);
            units.push(u);
        }
    }

    return units;
}
