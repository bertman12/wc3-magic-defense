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
        generateEnumsFromWTS(wtsFileContents);
    } else {
        fs.mkdirSync("src/parser-test");
        generateEnumsFromWTS(wtsFileContents);
    }
} catch (err: any) {
    logger.error(err.toString());
    logger.error(`There was an error generating the definition file for '${luaFile}'`);
}

type WTS_ObjectTypes = "Units" | "Items" | "Abilities" | "Buffs" | "Upgrades";
type WTS_LineMetaType = "Name" | "Tip" | "Ubertip";

enum LineWordIndexMap {
    StartIdentifier,
    ObjectType,
    FourCC,
    ObjectName,
    StringTypeShort, //tip, ubertip, name
    StringType, //Name, Tooltip, Tooltip Extended
}

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

    /**
     * @rule anytime we come across a parentheses, we want to start concatenating the following words until we reach a closing parentheses
     */

    // ["//", "Units:", "I000", "(Object Name)", "Name", "(Name)"]
    let currentLine: string[] = [];
    let lastReadWord = "";
    // let isReadingMultiWordObjectName = false;
    let concatenatingWordsInProgress = false;
    let firstCompositeWordAdded = false;

    //This does preserve the line breaks and the spaces
    for (let x = 0; x < fileContents.length; x++) {
        const char = fileContents[x];
        const nextChar = fileContents[x + 1];

        //At this point, we might have all the relevant data to create the new enum member, now we simple check our array of words for the line
        if (char === "\n") {
            newFileContents += "\n//";
            currentLine.forEach((word) => {
                newFileContents += word;
            });

            if (currentLine.includes("Name")) {
                newFileContents += "\n//current line includes name";

                const newLine = `\n${currentLine[3]} = FourCC(${currentLine[2]}),`;
                objectTypesEnumStrings.set(currentLine[1] as WTS_ObjectTypes, newLine);
               
            }

                currentLine = [];
            lastReadWord = "";

            // if (currentLine.length > 0) {
            //     newFileContents += `\n//Current line length: ${currentLine.length}`;
            // }
        }

        //means we have reached the end of the current word. here is where we check the word to orient ourself in the file contents
        //its possible last read word is still empty therefore we do not want to add that to our array.
        if (char === " " && lastReadWord) {
            //while were concatenating words, we do not want to push any new words into our array.

            //detect if we need to concatenate words
            if (shouldConcatWords(lastReadWord)) {
                concatenatingWordsInProgress = true;
                newFileContents += "\n//We are concatenating words now";
            } else if (!concatenatingWordsInProgress) {
                currentLine.push(lastReadWord);
            }

            if (concatenatingWordsInProgress && !firstCompositeWordAdded) {
                //This is the first word in the sequence, therefore push to the array
                currentLine.push(lastReadWord);
                firstCompositeWordAdded = true;
            }

            //We have already begun our composite word sequence
            if (concatenatingWordsInProgress && firstCompositeWordAdded) {
                //Add last read word to it
                currentLine[currentLine.length - 1] += lastReadWord;
            }

            //Check if we still need to concatenate words, we are done if its an end parentheses and theres a space after it.
            if (lastReadWord.includes(")") && nextChar === " ") {
                concatenatingWordsInProgress = false;
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

function shouldConcatWords(word: string) {
    return word.includes("(") && !word.includes(")");
}
