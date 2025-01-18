import { calculateAllPlayerFeatures } from "./calculateFeatures.js";
import teamLogs2324 from "../../Data/GameLogs/23-24.js";
import teamLogs2223 from "../../Data/GameLogs/22-23.js";
import teamLogs2122 from "../../Data/GameLogs/21-22.js";
import teamLogs2021 from "../../Data/GameLogs/20-21.js";
import teamLogs1920 from "../../Data/GameLogs/19-20.js";
import teamLogs1819 from "../../Data/GameLogs/18-19.js";
import teamLogs1718 from "../../Data/GameLogs/17-18.js";
import teamLogs1617 from "../../Data/GameLogs/16-17.js";
import teamLogs1516 from "../../Data/GameLogs/15-16.js";
import teamLogs1415 from "../../Data/GameLogs/14-15.js";
import teamLogs1314 from "../../Data/GameLogs/13-14.js";
import playerLogs2324 from "../../Data/GameLogs/2023-24.json" assert { type: "json" };
import playerLogs2223 from "../../Data/GameLogs/2022-23.json" assert { type: "json" };
import playerLogs2122 from "../../Data/GameLogs/2021-22.json" assert { type: "json" };
import playerLogs2021 from "../../Data/GameLogs/2020-21.json" assert { type: "json" };
import playerLogs1920 from "../../Data/GameLogs/2019-20.json" assert { type: "json" };
import playerLogs1819 from "../../Data/GameLogs/2018-19.json" assert { type: "json" };
import playerLogs1718 from "../../Data/GameLogs/2017-18.json" assert { type: "json" };
import playerLogs1617 from "../../Data/GameLogs/2016-17.json" assert { type: "json" };
import playerLogs1516 from "../../Data/GameLogs/2015-16.json" assert { type: "json" };
import playerLogs1415 from "../../Data/GameLogs/2014-15.json" assert { type: "json" };
import playerLogs1314 from "../../Data/GameLogs/2013-14.json" assert { type: "json" };
import playerLogs1213 from "../../Data/GameLogs/2012-13.json" assert { type: "json" };
import playerLogs1112 from "../../Data/GameLogs/2011-12.json" assert { type: "json" };
import biosData2324 from "../../Data/GameLogs/playerBios-2023-24.js";
import biosData2223 from "../../Data/GameLogs/playerBios-2022-23.js";
import biosData2122 from "../../Data/GameLogs/playerBios-2021-22.js";
import biosData2021 from "../../Data/GameLogs/playerBios-2020-21.js";
import biosData1920 from "../../Data/GameLogs/playerBios-2019-20.js";
import biosData1819 from "../../Data/GameLogs/playerBios-2018-19.js";
import biosData1718 from "../../Data/GameLogs/playerBios-2017-18.js";
import biosData1617 from "../../Data/GameLogs/playerBios-2016-17.js";
import biosData1516 from "../../Data/GameLogs/playerBios-2015-16.js";
import biosData1415 from "../../Data/GameLogs/playerBios-2014-15.js";
import biosData1314 from "../../Data/GameLogs/playerBios-2013-14.js";
import fs from "fs";

const trainTree = async () => {
  const data2324 = await calculateAllPlayerFeatures(
    playerLogs2324,
    teamLogs2324,
    playerLogs2223,
    playerLogs2122,
    "2023",
    "2022",
    biosData2324
  );
  const data2223 = await calculateAllPlayerFeatures(
    playerLogs2223,
    teamLogs2223,
    playerLogs2122,
    playerLogs2021,
    "2022",
    "2021",
    biosData2223
  );
  const data2122 = await calculateAllPlayerFeatures(
    playerLogs2122,
    teamLogs2122,
    playerLogs2021,
    playerLogs1920,
    "2021",
    "2020",
    biosData2122
  );
  const data2021 = await calculateAllPlayerFeatures(
    playerLogs2021,
    teamLogs2021,
    playerLogs1920,
    playerLogs1819,
    "2020",
    "2019",
    biosData2021
  );
  const data1920 = await calculateAllPlayerFeatures(
    playerLogs1920,
    teamLogs1920,
    playerLogs1819,
    playerLogs1718,
    "2019",
    "2018",
    biosData1920
  );
  const data1819 = await calculateAllPlayerFeatures(
    playerLogs1819,
    teamLogs1819,
    playerLogs1718,
    playerLogs1617,
    "2018",
    "2017",
    biosData1819
  );
  const data1718 = await calculateAllPlayerFeatures(
    playerLogs1718,
    teamLogs1718,
    playerLogs1617,
    playerLogs1516,
    "2017",
    "2016",
    biosData1718
  );
  const data1617 = await calculateAllPlayerFeatures(
    playerLogs1617,
    teamLogs1617,
    playerLogs1516,
    playerLogs1415,
    "2016",
    "2015",
    biosData1617
  );
  const data1516 = await calculateAllPlayerFeatures(
    playerLogs1516,
    teamLogs1516,
    playerLogs1415,
    playerLogs1314,
    "2015",
    "2014",
    biosData1516
  );
  const data1415 = await calculateAllPlayerFeatures(
    playerLogs1415,
    teamLogs1415,
    playerLogs1314,
    playerLogs1213,
    "2014",
    "2013",
    biosData1415
  );
  const data1314 = await calculateAllPlayerFeatures(
    playerLogs1314,
    teamLogs1314,
    playerLogs1213,
    playerLogs1112,
    "2013",
    "2012",
    biosData1314
  );
  return data1314.concat(
    data1415,
    data1516,
    data1617,
    data1718,
    data1819,
    data1920,
    data2021,
    data2122,
    data2223,
    data2324
  );
  // return data1314;
};

// Function to save data to a JSON file
export const saveDataToFile = async () => {
  try {
    const data = await trainTree(); // Get the data
    const filePath = "./data/trainingData-v1.json"; // Specify the path for the JSON file

    // Make sure the directory exists, otherwise create it
    const dir = "./data";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Convert data to JSON string
    const jsonData = JSON.stringify(data, null, 2); // Pretty print with 2-space indentation

    // Write the JSON data to the file
    fs.writeFileSync(filePath, jsonData, "utf8");

    console.log("Data successfully saved to trainingData-v1.json");
  } catch (error) {
    console.error("Error saving data to file:", error);
  }
};

// Call the function to save data
saveDataToFile();
