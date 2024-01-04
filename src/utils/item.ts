import { Effect, Item, Trigger, Unit } from "w3ts";
import { notifyPlayer, useTempEffect } from "./misc";

/**
 * Checks if the unit has an item in their item slots
 * @param u
 * @param itemTypeId
 * @returns
 */
export function unitHasItem(u: Unit, itemTypeId: number): boolean {
    for (let x = 0; x < 6; x++) {
        if (u.getItemInSlot(x)?.typeId === itemTypeId) {
            return true;
        }
    }

    return false;
}

// Player should pick up recipes when needed. if they are missing items then the recipe cost is refunded
export function trig_itemRecipeSystem() {
    //takes a set of items
    //unit or unit clicks
    const t = Trigger.create();

    t.registerAnyUnitEvent(EVENT_PLAYER_UNIT_PICKUP_ITEM);
    t.addAction(() => {
        const recipeItem = Item.fromEvent();
        const unit = Unit.fromHandle(GetTriggerUnit());

        if (!unit || !recipeItem) {
            return;
        }

        //for every item they have, if any has the word recipe, then we check to see if they have the items needed to satisfy the recipe
        for (let x = 0; x < 6; x++) {
            const currItem = unit?.getItemInSlot(x);
            if (currItem?.name.toLowerCase().includes("recipe")) {
                checkItemRecipeRequirements(unit, currItem);
            }
        }
    });
}

function checkItemRecipeRequirements(unit: Unit, recipeItem: Item) {
    if (recipeItem.name.toLowerCase().includes("recipe")) {
        let requiredItems: RecipeItemRequirement[] | null = null;
        let itemToCreateId = null;

        for (const [key, value] of itemRecipesMap.entries()) {
            if (key.recipeId === recipeItem.typeId) {
                requiredItems = value;
                itemToCreateId = key.itemId;
            }
        }

        if (!requiredItems) {
            print("Missing required items data for the recipe ", recipeItem.name);
            return;
        }

        /**
         * unique list of item types and their quantity and charges that we found on the unit
         */
        const matchingItems: RecipeItemRequirement[] = [];

        //Loop through the units item slots
        for (let x = 0; x < 6; x++) {
            const currItem = unit?.getItemInSlot(x);

            //Check that the current item matches at least one of the item types in the requirement list
            if (currItem && requiredItems.some((req) => req.itemTypeId === currItem.typeId)) {
                const alreadyStoredItemIndex = matchingItems.findIndex((itemReq) => itemReq.itemTypeId === currItem.typeId);

                //If we already came across this item in the unit inventory then increment the quantity
                if (alreadyStoredItemIndex && matchingItems[alreadyStoredItemIndex]) {
                    matchingItems[alreadyStoredItemIndex].quantity++;
                }
                //otherwise it is our first match with this item type, so add it to our array of matching items
                else {
                    matchingItems.push({ itemTypeId: currItem.typeId, quantity: 1, charges: 0 });
                }
            }
        }

        //Check that every item required is found in the units inventory satisfies the quantity requirement for the recipe
        const satisfiesRecipe =
            requiredItems.every((reqItemData) => {
                const matching = matchingItems?.find((matchingItemData) => matchingItemData.itemTypeId === reqItemData.itemTypeId);

                if (matching) {
                    return matching.quantity >= reqItemData.quantity;
                }

                return false;
            }) && matchingItems.length > 0;

        if (!itemToCreateId) {
            print("Missing the item type id of the item to create for this recipe: ", recipeItem.name);
        }

        //destroys more items than it needds to
        if (satisfiesRecipe && itemToCreateId) {
            //add the item
            requiredItems.forEach((req: RecipeItemRequirement) => {
                for (let x = 0; x < req.quantity; x++) {
                    for (let x = 0; x < 6; x++) {
                        const currItem = unit?.getItemInSlot(x);
                        if (currItem?.typeId === req.itemTypeId) {
                            currItem?.destroy();
                            break;
                        }
                    }
                }
            });

            recipeItem.destroy();

            unit.addItemById(itemToCreateId);

            useTempEffect(Effect.create("Abilities\\Spells\\Other\\Monsoon\\MonsoonBoltTarget.mdl", unit.x, unit.y));
            const clap = Effect.create("Abilities\\Spells\\Human\\Thunderclap\\ThunderClapCaster.mdl", unit.x, unit.y);
            clap?.setScaleMatrix(0.5, 0.5, 0.5);
            useTempEffect(clap);
        }

        if (!satisfiesRecipe) {
            //refund the gold
            notifyPlayer(`Missing recipe requirements for: ${recipeItem.name}.`);
        }

        //use if or rf to store item gold cost in the world editor
    }
}

interface RecipeItemRequirement {
    itemTypeId: number; //ITEMS;
    quantity: number;
    charges: number;
}

interface RecipeItem {
    recipeId: number;
    itemId: number;
}

const itemRecipesMap = new Map<RecipeItem, RecipeItemRequirement[]>([
    // [
    //     { recipeId: ITEMS.recipe_blinkTreads, itemId: ITEMS.blinkTreads },
    //     [
    //         { itemTypeId: ITEMS.bootsOfSpeed, quantity: 1, charges: 0 }, //
    //         { itemTypeId: ITEMS.blinkDagger, quantity: 1, charges: 0 }, //
    //     ],
    // ],
]);
