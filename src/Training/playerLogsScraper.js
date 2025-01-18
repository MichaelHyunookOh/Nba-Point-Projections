// import testInitialData from "../../Data/GameLogs/test.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getEligiblePlayers } from "./scrapers/getEligiblePlayers.js";
import { playerBoxScoreData } from "./scrapers/playerBoxScoreData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getEligiblePlayersData = async (year) => {
  const players = await getEligiblePlayers(year);
  console.log(players.length);
  const slicedPlayers = players.slice(30);
  const allPlayerData = [];
  const missingPlayerData = [];
  for await (const player of slicedPlayers) {
    try {
      const playerData = await playerBoxScoreData(player, year);
      allPlayerData.push(playerData);
      console.log(players.indexOf(player) + 1);
    } catch (error) {
      console.error(`Error calculating features for ${player}:`, error);
      missingPlayerData.push(player);
      continue;
    }
  }
  return allPlayerData;
};
function hasDuplicateValues(arr, first, last) {
  const valueCount = new Map();

  for (const obj of arr) {
    const firstName = obj[first];
    const lastName = obj[last];
    const fullName = `${firstName}-${lastName}`;

    // Increment the count for the value
    if (valueCount.has(fullName)) {
      console.log(firstName, lastName);
      return true; // Duplicate found
    } else {
      valueCount.set(fullName, 1);
    }
  }

  return false; // No duplicates found
}

// Find missing names
const findMissingNames = async () => {
  const fullNames = await getEligiblePlayers();
  // Flatten all player objects in arraysOfObjects into a single array
  const playersInObjects = testJSON.flat(2);

  // Helper function to check if a player is in the playersInObjects array
  const isPlayerInObjects = (fullName) => {
    return playersInObjects.some(
      (player) => `${player.name.toLowerCase()}` === fullName.toLowerCase()
    );
  };

  const missingNames = fullNames.filter(
    (fullName) => !isPlayerInObjects(fullName)
  );

  console.log(missingNames);
};

const test = async (year) => {
  // const wait = testJSON.map((item) => item[0]);
  // console.log(hasDuplicateValues(wait, "firstName", "lastName"));
  // console.log(testJSON.length);
  const newData = await getEligiblePlayersData(year);
  const filePath = path.resolve(__dirname, `../Data/Training/${year}.json`);
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        // If file doesn't exist, initialize it with newData
        fs.writeFile(filePath, JSON.stringify(newData, null, 4), (err) => {
          if (err) console.error("Error writing file:", err);
          else console.log("File created and data saved:");
        });
      } else {
        console.error("Error reading file:", err);
      }
      return;
    }
    try {
      // Parse existing JSON data
      const jsonArray = JSON.parse(data);
      // Loop through newData and append each item
      newData.forEach((item) => jsonArray.push(item));
      // Write the updated JSON array back to the file
      fs.writeFile(filePath, JSON.stringify(jsonArray, null, 4), (err) => {
        if (err) console.error("Error writing file:", err);
        else console.log("Data appended successfully:");
      });
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
    }
  });
};

test("2022-23");
