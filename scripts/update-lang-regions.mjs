import fs from "fs/promises";
import axios from "axios";

const constantsFileContent = await fs.readFile("./src/constants.ts", "utf8");
const splitContent = constantsFileContent.split("\n");

const languageCodeRowIndex = splitContent.findIndex(row => row.includes("LANGUAGE_CODES"));
const regionRowIndex = splitContent.findIndex(row => row.includes("SERVER_REGIONS"));

const languages = await axios.get("https://ddragon.leagueoflegends.com/cdn/languages.json").then(res => res.data);
const regions = await axios.get("https://ddragon.leagueoflegends.com/api/realms.json").then(res => res.data);

const langType = `export const LANGUAGE_CODES = ["${languages.join('", "')}"] as const;`
const regionType = `export const SERVER_REGIONS = ["${regions.join('", "')}"] as const;`

splitContent[languageCodeRowIndex] = langType;
splitContent[regionRowIndex] = regionType;

splitContent.splice(regionRowIndex - 1, 1, `/* Generated on ${new Date().toISOString()} */`)

await fs.writeFile("./src/constants.ts", splitContent.join("\n"))