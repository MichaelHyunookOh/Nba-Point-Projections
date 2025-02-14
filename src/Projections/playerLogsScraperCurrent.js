import path from "path";
import { fileURLToPath } from "url";
import { getAllCurrentPlayers } from "./propsScrapers/getAllCurrentPlayers.js";
import { playerBoxScoreData } from "../Training/scrapers/playerBoxScoreData.js";
import playerData from "../Data/GameLogs/playerDataToday.json" assert { type: "json" };
import { getPointLines } from "./propsScrapers/getPointLines.js";
import { getInjuryReport } from "./getInjuryReport.js";
import { normalizeText } from "./helpers/normalizeText.js";
import { storePlayerLines } from "../storePrizePicksLines.js";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getEliblePlayerNames = async (year) => {
  const allPlayers = await getAllCurrentPlayers(year);
  const playersWithProjections = await getPointLines();

  const injuredPlayers = await getInjuryReport();
  const playersWithProjectionsTeamsArr = playersWithProjections.map(
    (data) => data.team
  );
  const injuredPlayersToday = injuredPlayers.filter((player) =>
    playersWithProjectionsTeamsArr.includes(player.team)
  );

  const playerNamesWithProjections = playersWithProjections.map(
    (data) => data.name
  );
  const normalizedPlayersWithProjections =
    playerNamesWithProjections.map(normalizeText);
  const playersToPredict = allPlayers.filter((player) =>
    normalizedPlayersWithProjections.includes(normalizeText(player))
  );

  const injuredPlayerNames = injuredPlayersToday
    .filter((player) => player.status === "Out")
    .map((data) => data.player);
  const normalizedInjuredPlayerNames = injuredPlayerNames.map(normalizeText);
  const eligibleInjuredPlayers = allPlayers.filter((player) =>
    normalizedInjuredPlayerNames.includes(normalizeText(player))
  );
  return [...playersToPredict, ...eligibleInjuredPlayers];
};

export const getEligiblePlayersData = async (year) => {
  const eligiblePlayersArray = await getEliblePlayerNames(year);
  const playersAlreadyScraped = playerData.map((data) =>
    normalizeText(data[0].name)
  );
  const scrapeArr = eligiblePlayersArray.filter(
    (name) => !playersAlreadyScraped.includes(normalizeText(name))
  );
  console.log(eligiblePlayersArray);
  console.log(JSON.stringify(scrapeArr));
  const allPlayerData = [];
  const missingPlayerData = [];
  for await (const player of scrapeArr) {
    try {
      const playerData = await playerBoxScoreData(player, year);
      allPlayerData.push(playerData);
    } catch (error) {
      console.error(`Error calculating features for ${player}:`, error);
      missingPlayerData.push(player);
      continue;
    }
  }
  return allPlayerData;
};

export const scrapeAndSavePlayerData = async (year) => {
  const newData = await getEligiblePlayersData(year);
  const filePath = path.resolve(
    __dirname,
    `../Data/GameLogs/playerDataToday.json`
  );

  try {
    // Read the existing file
    let jsonArray = [];
    try {
      const data = await fs.promises.readFile(filePath, { encoding: "utf8" });
      jsonArray = JSON.parse(data); // Parse the existing data
    } catch (readErr) {
      if (readErr.code !== "ENOENT") {
        throw readErr; // Rethrow if it's not a 'file not found' error
      }
      // If file doesn't exist, initialize with an empty array
      console.log("File not found, creating a new one.");
    }

    // Append new data to the array
    jsonArray.push(...newData);

    // Write the updated JSON array back to the file
    await fs.promises.writeFile(filePath, JSON.stringify(jsonArray, null, 4));
    console.log("Data saved successfully.");
  } catch (error) {
    console.error("Error handling file:", error);
  }
};
// test("2024-25");
