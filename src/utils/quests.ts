import { Quest, Timer } from "w3ts";
import { tColor } from "./misc";

export function setup_quests() {
    Timer.create().start(1, false, () => {
        addQuest(
            "Basic Game Info",
            `\n
            \n${tColor("Main Objective", "goldenrod")}: Kill all enemy players.
        `,
            "ReplaceableTextures\\CommandButtons\\BTNPeasant.blp"
        );

        // \n${tColor("-fixSpawns", "goldenrod")}: Player 1 can only use this. This will fix add all player's spawn units to their corresponding spawn pool.
        addQuest(
            "Commands",
            `
            \n${tColor("-cam ####", "goldenrod")}: Sets the camera distance.
        `,
            "ReplaceableTextures\\WorldEditUI\\Doodad-Cinematic.blp",
            false
        );

        addQuest("|cffffcc00Creep Warlords - 1.06|r", "Created by JediMindTrix/NihilismIsDeath", "ReplaceableTextures\\CommandButtons\\BTNClayFigurine.blp", false);
    });
}

export function addQuest(title: string, description: string, iconPath?: string, required: boolean = true) {
    const q = Quest.create();
    if (q) {
        q.setTitle(title);
        q.required = required;
        q.setDescription(description);
        if (iconPath) {
            q.setIcon(iconPath);
        }
    }
}
