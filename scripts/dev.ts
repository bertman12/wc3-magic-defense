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

    enum TitleLineWordIndexMap {
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
    const objectTypeIdentifierToObjectType = new Map<string, WTS_ObjectTypes>([
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

    enum Token {
        DataBegin = "{",
        DataEnd = "}",
        TitleLineIndicator = "//",
    }

    enum ObjectDataTypeIndicator {
        Name = "Name",
        Tooltip = "Tip",
        TooltipExtended = "Ubertip",
        EditorSuffix = "EditorSuffix",
        Hotkey = "Hotkey",
    }

    let currentLineWords: string[] = [];
    let lastReadWord = "";
    let concatenatingWordsInProgress = false;
    let firstCompositeWordAdded = false;

    let dataLineValue = "";
    let storeNextLineAsEnumMemberName = false;

    //used to hold onto the title line while we are parsing the following lines for the actual data. Title lines are indicated with //
    // ["//", "Units:", "I000", "(Object Name)", "Name", "(Name)"]
    let titleLineWords: string[] = [];

    /**
     * @new_goals
     * @one get the title line data and hold onto that
     * @two get value from inside {}
     *
     * @title_line this line may not exist. if it does not exist then we skip saving lines until we actually come across a title line
     * @object_data_line holds the data type value indicated in the title line; can be name, tooltips, editor suffix, hotkeys, etc.
     *
     * @warn if there is no space after a character and only a new line then we must store account for that when saving last read word; for instance } is on a single line and does not have a space after it, therefore it wont be saved in
     * the last read word and this will not be saved in any of our line word arrays.
     *
     * This would also explain why the final words on a line are not in our word array
     *
     * we must know when to start saving the value in the object section of the object data. We can store that in a string and not an array, since the value there represents only one data type, the name in our case
     *
     * @other_goal the parser should simply capture every line indiscriminantly - we then process those lines and store the values if they are relevant to us
     *
     * END OF LINE - actions: store the line
     */

    for (let x = 0; x < fileContents.length; x++) {
        const char = fileContents[x];
        const nextChar = fileContents[x + 1];

        //we guarantee we are done reading data by checking current and next character
        if (isEndOfLine(nextChar) && char === Token.DataEnd && titleLineWords.includes(Token.TitleLineIndicator) && titleLineWords[TitleLineWordIndexMap.MetaLineTypeShort] == ObjectDataTypeIndicator.Name) {
            //Store the data as an enum value
            newFileContents += "\n//ENUM created";

            //Clear everything
            storeNextLineAsEnumMemberName = false;
            currentLineWords = [];
            firstCompositeWordAdded = false;
            concatenatingWordsInProgress = false;
            dataLineValue = "";
            titleLineWords = [];
            lastReadWord = "";
        }

        //End of line - process the values
        if (isEndOfLine(char)) {
            //Title line words are set the same line they are captured
            if (currentLineWords.includes(Token.TitleLineIndicator) && currentLineWords[TitleLineWordIndexMap.MetaLineTypeShort] == ObjectDataTypeIndicator.Name) {
                //Store the title line
                titleLineWords = [...currentLineWords];
                newFileContents += "\n//TITLE line data captured";
            }

            //If we have anything stored from the data section then we can use that to add it do our enum
            if (storeNextLineAsEnumMemberName && currentLineWords.length > 0 && titleLineWords[TitleLineWordIndexMap.MetaLineTypeShort] == ObjectDataTypeIndicator.Name) {
                //Add words to the array; Words should be concatenated already, so there will only be one element

                currentLineWords.forEach((word) => {
                    word.replace(" ", "");
                    dataLineValue += word;
                });

                newFileContents += `\n//DATA line data captured ${dataLineValue}`;
                // we have all the necessary data at this point - now we can create our enum

                const enumForObjectDataType = objectTypeIdentifierToObjectType.get(titleLineWords[TitleLineWordIndexMap.ObjectType]);
                const currentEnumString = objectTypesEnumStrings.get(enumForObjectDataType as WTS_ObjectTypes);

                //Clean word before checking if name is already used
                dataLineValue = dataLineValue.replace("(", "");
                dataLineValue = dataLineValue.replace(")", "");
                dataLineValue = dataLineValue.replace(",", "");
                dataLineValue = removeColorCodingFromWord(dataLineValue);
                dataLineValue = dataLineValue.replace("|r", "");

                const pattern = new RegExp("^[A-Za-z0-9]+$");

                //Replace illegal characters
                for (let x = 0; x < dataLineValue.length; x++) {
                    const c = dataLineValue[x];

                    if (!pattern.test(c)) {
                        dataLineValue = dataLineValue.replace(dataLineValue[x], "_");
                    }
                }

                const enumMemberWordSet = uniqueEnumMemberNames.get(enumForObjectDataType as WTS_ObjectTypes);

                //Add the new enum member
                if (enumMemberWordSet?.has(dataLineValue)) {
                    //Handle duplicate name by appending _FourCC to end of name
                    const newEnumMember = `${currentEnumString ? "\n" : ""}\t${dataLineValue}_${titleLineWords[TitleLineWordIndexMap.FourCC]} = FourCC("${titleLineWords[TitleLineWordIndexMap.FourCC]}"),`;

                    objectTypesEnumStrings.set(enumForObjectDataType as WTS_ObjectTypes, currentEnumString + newEnumMember);
                } else {
                    const newEnumMember = `${currentEnumString ? "\n" : ""}\t${dataLineValue} = FourCC("${titleLineWords[TitleLineWordIndexMap.FourCC]}"),`;

                    objectTypesEnumStrings.set(enumForObjectDataType as WTS_ObjectTypes, currentEnumString + newEnumMember);

                    if (enumMemberWordSet) {
                        enumMemberWordSet.add(dataLineValue);
                    }
                }

                //Reset since we captured the necessary data
                storeNextLineAsEnumMemberName = false;
                currentLineWords = [];
                firstCompositeWordAdded = false;
                concatenatingWordsInProgress = false;
                dataLineValue = "";
                titleLineWords = [];
                lastReadWord = "";
            }

            // if (currentLineWords[TitleLineWordIndexMap.MetaLineTypeShort] === ObjectDataTypeIndicator.Name && currentLineWords[TitleLineWordIndexMap.ObjectName]) {
            //     const enumForObjectType = objectTypeIdentifierToObjectType.get(currentLineWords[TitleLineWordIndexMap.ObjectType]);
            //     const currentEnumString = objectTypesEnumStrings.get(enumForObjectType as WTS_ObjectTypes);

            //     //Clean word before checking if name is already used
            //     currentLineWords[TitleLineWordIndexMap.ObjectName] = currentLineWords[TitleLineWordIndexMap.ObjectName].replace("(", "");
            //     currentLineWords[TitleLineWordIndexMap.ObjectName] = currentLineWords[TitleLineWordIndexMap.ObjectName].replace(")", "");
            //     currentLineWords[TitleLineWordIndexMap.ObjectName] = currentLineWords[TitleLineWordIndexMap.ObjectName].replace(",", "");
            //     currentLineWords[TitleLineWordIndexMap.ObjectName] = removeColorCodingFromWord(currentLineWords[TitleLineWordIndexMap.ObjectName]);
            //     currentLineWords[TitleLineWordIndexMap.ObjectName] = currentLineWords[TitleLineWordIndexMap.ObjectName].replace("|r", "");

            //     const pattern = new RegExp("^[A-Za-z0-9]+$");

            //     //Replace illegal characters
            //     for (let x = 0; x < currentLineWords[TitleLineWordIndexMap.ObjectName].length; x++) {
            //         const c = currentLineWords[TitleLineWordIndexMap.ObjectName][x];

            //         if (!pattern.test(c)) {
            //             currentLineWords[TitleLineWordIndexMap.ObjectName] = currentLineWords[TitleLineWordIndexMap.ObjectName].replace(currentLineWords[TitleLineWordIndexMap.ObjectName][x], "_");
            //         }
            //     }

            //     const enumMemberWordSet = uniqueEnumMemberNames.get(enumForObjectType as WTS_ObjectTypes);

            //     //Add the new enum member
            //     if (enumMemberWordSet?.has(currentLineWords[TitleLineWordIndexMap.ObjectName])) {
            //         //Handle duplicate name by appending _FourCC to end of name
            //         const newEnumMember = `${currentEnumString ? "\n" : ""}\t${currentLineWords[TitleLineWordIndexMap.ObjectName]}_${currentLineWords[TitleLineWordIndexMap.FourCC]} = FourCC("${currentLineWords[TitleLineWordIndexMap.FourCC]}"),`;

            //         objectTypesEnumStrings.set(enumForObjectType as WTS_ObjectTypes, currentEnumString + newEnumMember);
            //     } else {
            //         const newEnumMember = `${currentEnumString ? "\n" : ""}\t${currentLineWords[TitleLineWordIndexMap.ObjectName]} = FourCC("${currentLineWords[TitleLineWordIndexMap.FourCC]}"),`;

            //         objectTypesEnumStrings.set(enumForObjectType as WTS_ObjectTypes, currentEnumString + newEnumMember);

            //         if (enumMemberWordSet) {
            //             enumMemberWordSet.add(currentLineWords[TitleLineWordIndexMap.ObjectName]);
            //         }
            //     }
            // }

            //Current line is reset once we reach new line symbol
            currentLineWords = [];
            lastReadWord = "";
        }

        //Storing words into the current line - make this as simple as possible, only concatenate words based on a simple rule
        if ((isEndOfWord(char) || isEndOfLine(nextChar)) && lastReadWord) {
            //detect if we need to concatenate words
            if (shouldConcatenateWords(lastReadWord)) {
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
            //the composite word - we can leave this for now. this means our data line will be an array of words, which we will then process
            if (isFinalWordInConcatenationSequence(lastReadWord)) {
                concatenatingWordsInProgress = false;
                firstCompositeWordAdded = false;
                newFileContents += `\n//CONCATENATION COMPLETE - ${currentLineWords[currentLineWords.length - 1]}`;
            }

            //reset word after we have made use of it
            lastReadWord = "";
        } else if (char !== "\n" && char !== Token.DataBegin && char !== Token.DataEnd) {
            //Building the next word
            lastReadWord += char;
        }

        //Determine whether or not we care about the value in the next line
        //ObjectDataTypeIndicator.Name is our data target - we want that data really bad
        if (char === Token.DataBegin && titleLineWords.includes(Token.TitleLineIndicator) && titleLineWords[TitleLineWordIndexMap.MetaLineTypeShort] == ObjectDataTypeIndicator.Name) {
            storeNextLineAsEnumMemberName = true;
            newFileContents += "\n//DATA CAPTURE = TRUE";
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

/**
 * End of word can be indicated by the current character being an empty space or a newline character
 * @param char
 * @returns
 */
function isEndOfWord(char: string) {
    return char === " ";
}

function isEndOfLine(char: string) {
    return char === "\n";
}

function shouldConcatenateWords(word: string) {
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
    //Fl_r_ra_rm_re_r_r_

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
