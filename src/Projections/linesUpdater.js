import { scrapeAndSavePlayerData } from "./playerLogsScraperCurrent.js";
import { calculateAndUpdate } from "./calculateFeaturesForPredictions.js";
import fs from "fs";

export const linesUpdater = async (year) => {
  await scrapeAndSavePlayerData(year);
  await calculateAndUpdate();
};

// (async () => {
//   try {
//     await linesUpdater("2024-25"); // Call linesUpdater with the appropriate argument
//     console.log("linesUpdater has finished executing.");
//   } catch (error) {
//     console.error("Error running linesUpdater:", error);
//   }
// })();
