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
    const folderExists = fs.pathExistsSync("src/WTS Generated Enums");

    if (folderExists) {
        generateEnumsFromWTS(wtsFileContents);
    } else {
        fs.mkdirSync("src/WTS Generated Enums");
        generateEnumsFromWTS(wtsFileContents);
    }
} catch (err: any) {
    logger.error(err.toString());
    logger.error(`There was an error generating the definition file for '${luaFile}'`);
}
//79 character limit for object name on a single line unless its in the {} section
function generateEnumsFromWTS(fileContents: string) {
    let newFileContents = "";
    type WTS_ObjectTypes = "Units" | "Items" | "Destructibles" | "Doodads" | "Abilities" | "Buffs" | "Upgrades";

    enum LineWordIndexMap {
        StartIdentifier,
        ObjectType,
        FourCC,
        ObjectName,
        MetaLineTypeShort, //tip, ubertip, name
        MetaLineType, //(Name), Tooltip, Tooltip Extended
    }

    //To be concatenated together for the new file contents for generated enums
    const objectTypesEnumStrings = new Map<WTS_ObjectTypes, string>([
        ["Units", ""],
        ["Items", ""],
        ["Destructibles", ""],
        ["Doodads", ""],
        ["Abilities", ""],
        ["Buffs", ""],
        ["Upgrades", ""],
    ]);

    //Maps which specific strings in the file contents will map to which object type in the editor
    const objectTypeIdentifierToEnumName = new Map<string, WTS_ObjectTypes>([
        ["Units:", "Units"],
        ["Items:", "Items"],
        ["Destructibles:", "Destructibles"],
        ["Doodads:", "Doodads"],
        ["Abilities:", "Abilities"],
        ["Buffs:", "Buffs"],
        ["Upgrades:", "Upgrades"],
    ]);

    //Used when we create our enums at the end. We can also make this configurable in the config.json file to be to the user's preference
    const objectTypeEnumNames = new Map<WTS_ObjectTypes, string>([
        ["Units", "WTS_Units"],
        ["Items", "WTS_Items"],
        ["Destructibles", "WTS_Destructibles"],
        ["Doodads", "WTS_Doodads"],
        ["Abilities", "WTS_Abilities"],
        ["Buffs", "WTS_Buffs"],
        ["Upgrades", "WTS_Upgrades"],
    ]);

    const uniqueEnumMemberNames = new Map<WTS_ObjectTypes, Set<string>>([
        ["Units", new Set<string>()],
        ["Items", new Set<string>()],
        ["Destructibles", new Set<string>()],
        ["Doodads", new Set<string>()],
        ["Abilities", new Set<string>()],
        ["Buffs", new Set<string>()],
        ["Upgrades", new Set<string>()],
    ]);

    // ["//", "Units:", "I000", "(Object Name)", "Name", "(Name)"]
    let currentLineWords: string[] = [];
    let lastReadWord = "";
    let concatenatingWordsInProgress = false;
    let firstCompositeWordAdded = false;

    for (let x = 0; x < fileContents.length; x++) {
        const char = fileContents[x];

        if (char === "\n") {
            if (currentLineWords[LineWordIndexMap.MetaLineTypeShort] === "Name" && currentLineWords[LineWordIndexMap.ObjectName]) {
                const enumForObjectType = objectTypeIdentifierToEnumName.get(currentLineWords[LineWordIndexMap.ObjectType]);
                const currentEnumString = objectTypesEnumStrings.get(enumForObjectType as WTS_ObjectTypes);

                currentLineWords[LineWordIndexMap.ObjectName] = currentLineWords[LineWordIndexMap.ObjectName].replace("(", "");
                currentLineWords[LineWordIndexMap.ObjectName] = currentLineWords[LineWordIndexMap.ObjectName].replace(")", "");
                currentLineWords[LineWordIndexMap.ObjectName] = currentLineWords[LineWordIndexMap.ObjectName].replace(",", "");

                //Clean word before checking if name is already used
                currentLineWords[LineWordIndexMap.ObjectName] = removeColorCodingFromWord(currentLineWords[LineWordIndexMap.ObjectName]);
                currentLineWords[LineWordIndexMap.ObjectName] = currentLineWords[LineWordIndexMap.ObjectName].replace("|r", "");
                // currentLineWords[LineWordIndexMap.ObjectName] = currentLineWords[LineWordIndexMap.ObjectName].replace("|", "");

                const pattern = new RegExp("^[A-Za-z0-9]+$");

                for (let x = 0; x < currentLineWords[LineWordIndexMap.ObjectName].length; x++) {
                    const c = currentLineWords[LineWordIndexMap.ObjectName][x];

                    if (!pattern.test(c)) {
                        //Replace the illegal character
                        currentLineWords[LineWordIndexMap.ObjectName] = currentLineWords[LineWordIndexMap.ObjectName].replace(currentLineWords[LineWordIndexMap.ObjectName][x], "_");
                    }
                }

                //9 characters following the |
                const enumMemberWordSet = uniqueEnumMemberNames.get(enumForObjectType as WTS_ObjectTypes);

                //Add the new enum member
                if (enumMemberWordSet?.has(currentLineWords[LineWordIndexMap.ObjectName])) {
                    const newEnumMember = `${currentEnumString ? "\n" : ""}\t${currentLineWords[LineWordIndexMap.ObjectName]}_${currentLineWords[LineWordIndexMap.FourCC]} = FourCC("${currentLineWords[LineWordIndexMap.FourCC]}"),`;

                    objectTypesEnumStrings.set(enumForObjectType as WTS_ObjectTypes, currentEnumString + newEnumMember);
                } else {
                    const newEnumMember = `${currentEnumString ? "\n" : ""}\t${currentLineWords[LineWordIndexMap.ObjectName]} = FourCC("${currentLineWords[LineWordIndexMap.FourCC]}"),`;

                    objectTypesEnumStrings.set(enumForObjectType as WTS_ObjectTypes, currentEnumString + newEnumMember);

                    if (enumMemberWordSet) {
                        enumMemberWordSet.add(currentLineWords[LineWordIndexMap.ObjectName]);
                    }
                }
            }

            //Current line is reset once we reach new line symbol
            currentLineWords = [];
            lastReadWord = "";
        }

        if (char === " " && lastReadWord) {
            //detect if we need to concatenate words
            if (shouldConcatWords(lastReadWord)) {
                concatenatingWordsInProgress = true;
            }

            //We have already started making a composite word which means the last item in the array is our composite word
            if (concatenatingWordsInProgress && firstCompositeWordAdded) {
                //Add last read word to it
                currentLineWords[currentLineWords.length - 1] += lastReadWord;
            }

            //If we are making a composite word but haven't started yet, then push the first word into the array
            if (concatenatingWordsInProgress && !firstCompositeWordAdded) {
                currentLineWords.push(lastReadWord);
                firstCompositeWordAdded = true;
            }

            if (!concatenatingWordsInProgress) {
                currentLineWords.push(lastReadWord);
            }

            //Check if we still need to concatenate words, we are done if its an end parentheses and theres a space after it.
            //Example word is Name) therefore we should not push this word into the array it should just be added the last item in the array to complete
            //the composite word
            if (isFinalWordInConcatenationSequence(lastReadWord)) {
                concatenatingWordsInProgress = false;
                firstCompositeWordAdded = false;
            }

            //reset word after we have made use of it
            lastReadWord = "";
        } else if (char !== "\n") {
            //Building the next word
            lastReadWord += char;
        }
    }

    //Now we create our enums with the string data we parsed
    for (const [key, value] of objectTypesEnumStrings) {
        const newEnumName = objectTypeEnumNames.get(key);

        if (key && value) {
            newFileContents += `\nexport enum ${newEnumName}{\n${value}\n}\n`;
        }
    }

    fs.createFileSync("src/WTS Generated Enums/WTS_Enums.ts");
    fs.writeFileSync("src/WTS Generated Enums/WTS_Enums.ts", newFileContents);
}

function shouldConcatWords(word: string) {
    return word.includes("(") && !word.includes(")");
}

function isFinalWordInConcatenationSequence(word: string) {
    return word.includes(")") || word.includes("),");
}

/**
 * Removes color coding from word for clean enum member names
 * Its possible there are multiple color coding sequences in the string
 * @param word
 * @returns
 */
function removeColorCodingFromWord(word: string) {
    //Input
    //|cff00ff00F|r|cff1be31bl|r|cff37c737a|r|cff54aa54m|r|cff708e70e|r|cff8c728c |r|cffa955a9R|r|cffc539c5u|r|cffe11de1n|r|cfffe00fee|r
    //F|r|cff1be31bl|r|cff37c737a|r|cff54aa54m|r|cff708e70e|r|cff8c728c |r|cffa955a9R|r|cffc539c5u|r|cffe11de1n|r|cfffe00fee|r
    //l|r|cff37c737
    //a|r|cff54aa54m|r|cff708e70e|r|cff8c728c |r|cffa955a9R|r|cffc539c5u|r|cffe11de1n|r|cfffe00fee|r
    //m|r|cff708e70e|r|cff8c728c |r|cffa955a9R|r|cffc539c5u|r|cffe11de1n|r|cfffe00fee|r
    //e|r|cff8c728c |r|cffa955a9R|r|cffc539c5u|r|cffe11de1n|r|cfffe00fee|r
    // |r|cffa955a9R|r|cffc539c5u|r|cffe11de1n|r|cfffe00fee|r
    //R|r|cffc539c5u|r|cffe11de1n|r|cfffe00fee|r
    //u|r|cffe11de1n|r|cfffe00fee|r
    //n|r|cfffe00fee|r
    //e|r

    //Output
    //F|rl|r_ra_rm_re_r_r_

    if (word.includes("|cff")) {
        //iterate through word, find every point where there is a |cff then remove the following 9 characters from the word
        for (let x = 0; x < word.length; x++) {
            const char = word[x];
            //Color code sequence detected

            if (char === "|" && word[x + 1] === "c" && word[x + 2] === "f" && word[x + 3] === "f") {
                //remove 10 characters
                const chars = word.split("");

                for (let i = x; i < x + 10; i++) {
                    chars[i] = "";
                }

                word = chars.join("");
            }
        }

        return word;
    } else {
        return word;
    }
}
