import { calculateAllPlayerFeatures } from "./calculateFeatures.js";
import teamLogs2425 from "../Data/Training/24-25.js";
import teamLogs2324 from "../Data/Training/23-24.js";
import teamLogs2223 from "../Data/Training/22-23.js";
import teamLogs2122 from "../Data/Training/21-22.js";
import teamLogs2021 from "../Data/Training/20-21.js";
import teamLogs1920 from "../Data/Training/19-20.js";
import teamLogs1819 from "../Data/Training/18-19.js";
import teamLogs1718 from "../Data/Training/17-18.js";
import playerLogs2425 from "../Data/Training/2024-25.json" assert { type: "json" };
import playerLogs2324 from "../Data/Training/2023-24.json" assert { type: "json" };
import playerLogs2223 from "../Data/Training/2022-23.json" assert { type: "json" };
import playerLogs2122 from "../Data/Training/2021-22.json" assert { type: "json" };
import playerLogs2021 from "../Data/Training/2020-21.json" assert { type: "json" };
import playerLogs1920 from "../Data/Training/2019-20.json" assert { type: "json" };
import playerLogs1819 from "../Data/Training/2018-19.json" assert { type: "json" };
import playerLogs1718 from "../Data/Training/2017-18.json" assert { type: "json" };
import biosData2425 from "../Data/Training/playerBios-2024-25.js";
import biosData2324 from "../Data/Training/playerBios-2023-24.js";
import biosData2223 from "../Data/Training/playerBios-2022-23.js";
import biosData2122 from "../Data/Training/playerBios-2021-22.js";
import biosData2021 from "../Data/Training/playerBios-2020-21.js";
import biosData1920 from "../Data/Training/playerBios-2019-20.js";
import biosData1819 from "../Data/Training/playerBios-2018-19.js";
import biosData1718 from "../Data/Training/playerBios-2017-18.js";
import fs from "fs";

const trainTree = async () => {
  // const data2425 = await calculateAllPlayerFeatures(
  //   playerLogs2425,
  //   teamLogs2425,
  //   biosData2425,
  //   10,
  //   20
  // );
  const data2324 = await calculateAllPlayerFeatures(
    playerLogs2324,
    teamLogs2324,
    biosData2324,
    10,
    20
  );
  const data2223 = await calculateAllPlayerFeatures(
    playerLogs2223,
    teamLogs2223,
    biosData2223,
    10,
    20
  );
  const data2122 = await calculateAllPlayerFeatures(
    playerLogs2122,
    teamLogs2122,
    biosData2122,
    10,
    20
  );
  const data2021 = await calculateAllPlayerFeatures(
    playerLogs2021,
    teamLogs2021,
    biosData2021,
    10,
    20
  );
  const data1920 = await calculateAllPlayerFeatures(
    playerLogs1920,
    teamLogs1920,
    biosData1920,
    10,
    20
  );
  const data1819 = await calculateAllPlayerFeatures(
    playerLogs1819,
    teamLogs1819,
    biosData1819,
    10,
    20
  );
  const data1718 = await calculateAllPlayerFeatures(
    playerLogs1718,
    teamLogs1718,
    biosData1718,
    10,
    20
  );
  return data1718.concat(
    data1819,
    data1920,
    data2021,
    data2122,
    data2223,
    data2324
  );
  // return data2425;
};

// Function to save data to a JSON file
export const saveDataToFile = async () => {
  try {
    const data = await trainTree(); // Get the data
    const filePath = "./data/trainingData-v11.json"; // Specify the path for the JSON file

    // Make sure the directory exists, otherwise create it
    const dir = "./data";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Convert data to JSON string
    const jsonData = JSON.stringify(data, null, 2); // Pretty print with 2-space indentation

    // Write the JSON data to the file
    fs.writeFileSync(filePath, jsonData, "utf8");

    console.log("Data successfully saved to trainingData-v5.json");
  } catch (error) {
    console.error("Error saving data to file:", error);
  }
};

// Call the function to save data
saveDataToFile();
