import * as fs from "fs-extra";
import { loadJsonFile, logger } from "./utils";

const War3TSTLHelper = require("war3tstlhelper");

const config = loadJsonFile("config.json");

// Create definitions file for generated globals
const luaFile = `./maps/${config.mapFolder}/war3map.lua`;
//Contains all the strings for custom object data
const wtsFile = `./maps/${config.mapFolder}/war3map.wts`;

try {
    const contents = fs.readFileSync(luaFile, "utf8");
    const parser = new War3TSTLHelper(contents);
    const result = parser.genTSDefinitions();
    fs.writeFileSync("src/war3map.d.ts", result);

    const wtsFileContents = fs.readFileSync(wtsFile, "utf8");
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

type WTS_ObjectTypes = "Units" | "Items" | "Abilities" | "Buffs" | "Upgrades";

function generateEnumsFromWTS(fileContents: string) {
    let newFileContents = "";

    //For fucking around
    const charReplacementMap = new Map<string, string>([
        [" ", "-space-"],
        ["\n", "-new-line-"],
        ["\t", "-tab-"],
    ]);

    //To be concatenated together for the new file contents for generated enums
    const objectTypesEnumStrings = new Map<WTS_ObjectTypes, string>([
        ["Units", ""],
        ["Abilities", ""],
        ["Items", ""],
        ["Buffs", ""],
        ["Upgrades", ""],
    ]);

    //Maps which specific strings in the file contents will map to which object type in the editor
    const objectTypeIdentifier = new Map<string, WTS_ObjectTypes>([
        ["Units:", "Units"],
        ["Items:", "Items"],
        ["Abilities:", "Abilities"],
        ["Buffs:", "Buffs"],
        ["Upgrades:", "Upgrades"],
    ]);

    //Used when we create our enums at the end. We can also make this configurable in the config.json file to be to the user's preference
    const objectTypeEnumNames = new Map<WTS_ObjectTypes, string>([
        ["Units", "WTS_Units"],
        ["Abilities", "WTS_Abilities"],
        ["Items", "WTS_Items"],
        ["Buffs", "WTS_Buffs"],
        ["Upgrades", "WTS_Upgrades"],
    ]);

    /**
     * @goals
     *
     * @one determine format for how one object string begins and ends
     * @two identify which category of object data does this string correlate with
     * @three grab the name of the object and the FourCC code
     * @four check if the enum name is already in use, if so, then append_copy####
     * @five add that to the appropriate enum
     * @six bundle the strings together to create one file of generated enums to be used in the project
     *
     */

    let lastReadWord = "";
    let lastReadObjectName = "";
    let lastReadFourCC = "";
    let lastReadObjectType: WTS_ObjectTypes | null = null;
    let haveBegunReadingNewObjectName = false;
    let haveEndedReadingNewObjectName = false;
    let grabFourCCFromNextWord = false;

    //This does preserve the line breaks and the spaces
    for (let x = 0; x < fileContents.length; x++) {
        const char = fileContents[x];

        //Identify spaces to identify words
        //Identify double slashes to identify object data we want to read

        //means we have reached the end of the current word. here is where we check the word to orient ourself in the file contents
        if (char === " ") {
            const knownObjectType = objectTypeIdentifier.has(lastReadWord);

            //We have our object type and four cc and now we have our object name
            if (lastReadFourCC && lastReadObjectType) {
                newFileContents += `\n//found object name`;

                //We have read both an object type and a four CC, therefore our next word will now be the object name
                //Here we have confirmed that the last read word will be the object name, according to how the wts file outputs object data

                //We identify if we are at the end of our object name
                if (lastReadWord.includes(")")) {
                    haveEndedReadingNewObjectName = true;
                }

                //Clean the last read word
                lastReadWord = lastReadWord.replace("(", "");
                lastReadWord = lastReadWord.replace(")", "");

                //We know we are reading an object name, therefore we must start concatenating the name for the enum member name
                lastReadObjectName += lastReadWord;
            }

            if (haveEndedReadingNewObjectName && lastReadObjectName && lastReadObjectType) {
                let objectTypeEnumStringContents = objectTypesEnumStrings.get(lastReadObjectType);
                const newLine = `\n${lastReadObjectName} = FourCC(${lastReadFourCC}),`;
                objectTypeEnumStringContents += newLine;

                newFileContents += `\n//a new enum member was created - ${newLine}`;

                //Now clear the data for our temp variables
                lastReadWord = "";
                lastReadObjectName = "";
                lastReadFourCC = "";
                lastReadObjectType = null;
                grabFourCCFromNextWord = false;
            }

            if (grabFourCCFromNextWord && lastReadObjectType) {
                lastReadFourCC = lastReadWord;
            }

            if (knownObjectType) {
                grabFourCCFromNextWord = true;
                newFileContents += "\n//found object type identifier";

                lastReadObjectType = objectTypeIdentifier.get(lastReadWord) ?? null;
            } else {
                grabFourCCFromNextWord = false;
            }

            //reset word after we have made use of it
            lastReadWord = "";
        } else {
            //Building the next word
            lastReadWord += char;
        }
    }

    //Now we create our enums with the string data we parsed
    for (const [key, value] of objectTypesEnumStrings) {
        const newEnumName = objectTypeEnumNames.get(key);

        newFileContents += `\nexport enum ${newEnumName}{\n${value}\n}`;
    }

    fs.writeFileSync("src/parser-test/GeneratedEnums.ts", newFileContents);
}
