import { W3TS_HOOK, addScriptHook } from "w3ts/hooks";
import { setup_createHero } from "./game/createHero";
import { trig_setCameraDistance } from "./utils/camera";
import { notifyPlayer, tColor } from "./utils/misc";
import { setup_quests } from "./utils/quests";

const BUILD_DATE = compiletime(() => new Date().toUTCString());
const TS_VERSION = compiletime(() => require("typescript").version);
const TSTL_VERSION = compiletime(() => require("typescript-to-lua").version);

compiletime(({ objectData, constants }) => {
    const unit = objectData.units.get(constants.units.Footman);

    if (!unit) {
        return;
    }

    unit.modelFile = "units\\human\\TheCaptain\\TheCaptain.mdl";

    objectData.save();
});

function tsMain() {
    try {
        print(`Build: ${BUILD_DATE}`);
        print(`Typescript: v${TS_VERSION}`);
        print(`Transpiler: v${TSTL_VERSION}`);
        print(" ");

        notifyPlayer(`${tColor("Objective", "goldenrod")}: Find a core to build your base on.`);
        trig_setCameraDistance();
        setup_quests();
        setup_createHero();
    } catch (e) {
        print(e);
    }
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, tsMain);
