import * as fs from "fs-extra";
import { loadJsonFile, logger } from "./utils";

const War3TSTLHelper = require("war3tstlhelper");

const config = loadJsonFile("config.json");

// Create definitions file for generated globals
const luaFile = `./maps/${config.mapFolder}/war3map.lua`;
const customStringsFile = `./maps/${config.mapFolder}/war3map.wts`;

try {
    const contents = fs.readFileSync(luaFile, "utf8");
    const parser = new War3TSTLHelper(contents);
    const result = parser.genTSDefinitions();
    fs.writeFileSync("src/war3map.d.ts", result);

    const wtsFileContents = fs.readFileSync(customStringsFile, "utf8");
    const alreadyCreated = fs.pathExistsSync("src/parser-test");
    if (alreadyCreated) {
        // fs.writeFileSync("src/parser-test/stuff.txt", wtsFileContents);
        generateEnumsFromWTS(wtsFileContents);
    } else {
        fs.mkdirSync("src/parser-test");
        // fs.writeFileSync("src/parser-test/stuff.txt", wtsFileContents);
        generateEnumsFromWTS(wtsFileContents);
    }
} catch (err: any) {
    logger.error(err.toString());
    logger.error(`There was an error generating the definition file for '${luaFile}'`);
}

type WTS_ObjectTypeIdentifiers = "Units" | "Items" | "Abilities" | "Buffs" | "Upgrades";

function generateEnumsFromWTS(fileContents: string) {
    let allInOne = "";
    //For playing around
    const charReplacementMap = new Map<string, string>([
        [" ", "-space-"],
        ["\n", "-new-line-"],
        ["\t", "-tab-"],
    ]);

    //This does preserve the line breaks and the spaces
    for (let x = 0; x < fileContents.length; x++) {
        const char = fileContents[x];

        if (charReplacementMap.has(char)) {
            allInOne += charReplacementMap.get(char) ?? "-undefined-char-";
        } else {
            allInOne += char;
        }
    }

    fs.writeFileSync("src/parser-test/stuff.txt", allInOne);
}
