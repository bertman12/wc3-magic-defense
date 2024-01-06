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
    const folderExists = fs.pathExistsSync("src/parser-test");

    if (folderExists) {
        generateEnumsFromWTS(wtsFileContents);
    } else {
        fs.mkdirSync("src/parser-test");
        generateEnumsFromWTS(wtsFileContents);
    }
} catch (err: any) {
    logger.error(err.toString());
    logger.error(`There was an error generating the definition file for '${luaFile}'`);
}

function generateEnumsFromWTS(fileContents: string) {
    let newFileContents = "";
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
    //For fucking around
    const charReplacementMap = new Map<string, string>([
        [" ", "-space-"],
        ["\n", "-new-line-"],
        ["\t", "-tab-"],
        ["-", "_"],
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
    let currentLineWords: string[] = [];
    let lastReadWord = "";
    // let isReadingMultiWordObjectName = false;
    let concatenatingWordsInProgress = false;
    let firstCompositeWordAdded = false;

    /**
     * What I think its doing
     * 0 - lastReadWord = //
     * 1 - lastReadWord = Units:
     * 2 - lastReadWord = h000
       3 -  * lastReadWord = (My
       3 -  * lastReadWord = Object
       3 -  * lastReadWord = Name)
    *  4 - Name
    *  5 - (Name)
     */

    //This does preserve the line breaks and the spaces
    for (let x = 0; x < fileContents.length; x++) {
        const char = fileContents[x];
        const nextChar = fileContents[x + 1];

        //At this point, we might have all the relevant data to create the new enum member, now we simple check our array of words for the line
        if (char === "\n") {
            // if (currentLine.length > 1) {
            //     newFileContents += `\n//`;
            //     currentLine.forEach((word, index) => {
            //         newFileContents += `(index: ${index}) ${word} `;
            //     });
            // }

            if (currentLineWords.includes("Name") && currentLineWords[3]) {
                currentLineWords[3] = currentLineWords[3]?.replace("(", "");
                currentLineWords[3] = currentLineWords[3]?.replace(")", "");
                currentLineWords[3] = currentLineWords[3]?.replace(",", "");

                const pattern = new RegExp("[a-z]");
                for (let x = 0; x < currentLineWords[3].length; x++) {
                    const c = currentLineWords[3][x];

                    if (!pattern.test(c)) {
                        //Replace the illegal character
                        currentLineWords[3].replace(currentLineWords[3][x], "_");
                    }
                }

                const newLine = `\n${currentLineWords[3]} = FourCC("${currentLineWords[2]}"),`;

                const objectType = objectTypeIdentifier.get(currentLineWords[1]);
                const currentValue = objectTypesEnumStrings.get(objectType as WTS_ObjectTypes);

                objectTypesEnumStrings.set(objectType as WTS_ObjectTypes, currentValue + newLine);
            }

            //Current line is reset once we reach new line symbol
            currentLineWords = [];
            lastReadWord = "";
        }

        //means we have reached the end of the current word. here is where we check the word to orient ourself in the file contents
        //its possible last read word is still empty therefore we do not want to add that to our array.
        if (char === " " && lastReadWord) {
            //while were concatenating words, we do not want to push any new words into our array.

            //detect if we need to concatenate words
            if (shouldConcatWords(lastReadWord)) {
                concatenatingWordsInProgress = true;
            }

            //We have already started making a composite word which means the last item in the array is our composite word
            if (concatenatingWordsInProgress && firstCompositeWordAdded) {
                //Add last read word to it
                currentLineWords[currentLineWords.length - 1] += lastReadWord;
            }

            //If we are adding word but haven't started yet, then push the first word into the array
            if (concatenatingWordsInProgress && !firstCompositeWordAdded) {
                //This is the first word in the sequence, therefore push to the array
                currentLineWords.push(lastReadWord);
                firstCompositeWordAdded = true;
            }

            /**
             * on our next pass, if we have just completed a composite word, then we can start pushing new items in the array as normal
             */
            if (!concatenatingWordsInProgress) {
                currentLineWords.push(lastReadWord);
            }

            //Check if we still need to concatenate words, we are done if its an end parentheses and theres a space after it.
            //Example word is Name) therefore we should not push this word into the array it should just be added the last item in the array to complete
            //the composite word
            if (lastReadWord.includes(")") || lastReadWord.includes("),")) {
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

    /**
     * What I think its doing
     * 0 - lastReadWord = //
     * 1 - lastReadWord = Units:
     * 2 - lastReadWord = h000
       3 -  * lastReadWord = (My
       3 -  * lastReadWord = Object
       3 -  * lastReadWord = Name)
    *  4 - Name
    *  5 - (Name)
     */
    //Now we create our enums with the string data we parsed
    for (const [key, value] of objectTypesEnumStrings) {
        const newEnumName = objectTypeEnumNames.get(key);

        if (key && value) {
            newFileContents += `\nexport enum ${newEnumName}{\n${value}\n}`;
        }
    }

    fs.writeFileSync("src/parser-test/GeneratedEnums.ts", newFileContents);
}

function shouldConcatWords(word: string) {
    return word.includes("(") && !word.includes(")");
}
