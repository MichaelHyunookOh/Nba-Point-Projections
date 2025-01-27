// import testInitialData from "../../Data/GameLogs/test.js";
import testTeamData from "../Data/GameLogs/currentGameLogs.js";
import fs from "fs";
import axios from "axios";
// import testPlayerData from "../Data/GameLogs/playerDataToday.json" assert { type: "json" };
import testJSONLastSeason from "../Data/Training/2023-24.json" assert { type: "json" };
import testJSONLastLastSeason from "../Data/Training/2022-23.json" assert { type: "json" };
import testBiosData from "../Data/Training/playerBios-2024-25.js";
import path from "path";
import { fileURLToPath } from "url";
import { getPointLines } from "./propsScrapers/getPointLines.js";
import { getInjuryReport } from "./getInjuryReport.js";
import { normalizeText } from "./helpers/normalizeText.js";
import { runModel1 } from "./predictPoints1.js";
import { runModel2 } from "./predictPoints2.js";
import { runModel3 } from "./predictPoints3.js";
import {
  ppgLastSeason,
  daysSinceLastGamePlayedCurrent,
  addDNPLogs,
  missingOffensiveValue,
  scoringVariance,
  scoringRate,
  pointsAverageAfterDate,
  daysSinceLastGamePlayed,
  traditionalStatAverage,
  traditionalPercentageAverage,
  calculateUsgAverage,
  calculateEFGAverage,
  calculateTSAverage,
  calculateTeamPace,
  calculateTeamOrtg,
  teamOReboundRateAvg,
  oppTeamDReboundRateAvg,
  oppTeamFTRateAgainstAvg,
  playerFTRateAvg,
  oppTeamDFGAvg,
  calculateTeamPossessions,
  calcPointsOffTurnoversPercentage,
  getPlayerAge,
  oppTeamTORateAvg,
  oppTeamPercentThreesTakenAgainstAvg,
  calcPITPPercentage,
  oppTeam3paAgainstRelativeAvg,
  oppTeam3pPercentAgainstRelativeAvg,
  oppTeamFbPointsAllowedAvg,
  oppTeamPtsAllowedAvg,
  oppTeamFgPercentAgainstRelativeAvg,
  oppTeamPITPAllowedAvg,
  oppTeamDrtgAgainstRelativeAvg,
} from "../Formulas/liveFeatures.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const calculatePlayerFeatures = (
  logs,
  allPlayerLogs,
  teamData,
  lastYearLogs,
  lastLastYearLogs,
  lastYear,
  lastLastYear,
  biosData,
  injuredPlayerNames,
  pointLinesData
) => {
  const lastGame = logs[logs.length - 1];
  // console.log(logs);
  const lastGameIndex = logs.length - 1;
  const playerLineData = pointLinesData.filter(
    (data) => normalizeText(lastGame.name) === normalizeText(data.name)
  );
  // console.log(playerLineData);
  const homeAway = playerLineData[0]?.opponent.split(" ")[0];
  const matchDescArr = lastGame.MATCHUP.split(" - ");
  const date = new Date(matchDescArr[0]);
  const todayGameDate = new Date();
  const dateString = date.toDateString();
  const teamName = matchDescArr[1].split(" ")[0];
  const opposingTeam = playerLineData[0]?.opponent.split(" ")[1];

  const height = parseFloat(
    lastGame.height.split(" ")[1].match(/\d+(\.\d+)?/)[0]
  );
  const weight = parseFloat(
    lastGame.weight.split(" ")[1].replace(/[^\d.]/g, "")
  );
  const oppTeamGames = teamData.filter((game) => game.TEAM === opposingTeam);
  const currentIndexOppTeam = oppTeamGames.length;
  // console.log(parseFloat(playerLineData[0].points?.replace(/[^\d.-]/g, "")));
  const playerFeatures = [
    {
      playerName: lastGame.name,
      team: teamName,
      opponent: opposingTeam,
      prizePicksLine:
        parseFloat(playerLineData[0].points?.replace(/[^\d.-]/g, "")) ||
        undefined,
    },
    {
      daysSinceLastGame: daysSinceLastGamePlayedCurrent(
        logs,
        lastGameIndex,
        todayGameDate
      ),
      date: dateString,
      team: matchDescArr[1].split(" ")[0],
      opp: opposingTeam,
      height,
      weight,
      age: getPlayerAge(lastGame.name, biosData),
      home: homeAway === "vs" ? 1 : 0,
      gamesPlayed: logs.length,
      missingOffensiveValue: missingOffensiveValue(
        teamData,
        teamName,
        todayGameDate,
        allPlayerLogs,
        injuredPlayerNames
      ),
      previousPPG: pointsAverageAfterDate(
        lastGame.name,
        lastYearLogs,
        lastLastYearLogs,
        lastYear,
        lastLastYear,
        2,
        10
      ),
      ppgLast5: traditionalStatAverage(logs, logs.length, "PTS", 5),
      ppgSeason: traditionalStatAverage(logs, logs.length, "PTS", logs.length),
      scoringVarianceSeason: scoringVariance(logs, logs.length, logs.length),
      scoringRateLast5: scoringRate(logs, logs.length, 5),
      scoringRateSeason: scoringRate(logs, logs.length, logs.length),
      mpgLast5: traditionalStatAverage(logs, logs.length, "MIN", 5),
      mpgSeason: traditionalStatAverage(logs, logs.length, "MIN", logs.length),
      fgaLast5: traditionalStatAverage(logs, logs.length, "FGA", 5),
      fgaSeason: traditionalStatAverage(logs, logs.length, "FGA", logs.length),
      threesAttemptedLast5: traditionalStatAverage(logs, logs.length, "3PA", 5),
      threesAttemptedSeason: traditionalStatAverage(
        logs,
        logs.length,
        "3PA",
        logs.length
      ),
      threesMadePercentageLast5: traditionalPercentageAverage(
        logs,
        logs.length,
        "3PA",
        "3PM",
        5
      ),
      threesMadePercentageSeason: traditionalPercentageAverage(
        logs,
        logs.length,
        "3PA",
        "3PM",
        logs.length
      ),
      ftPercentageLast5: traditionalPercentageAverage(
        logs,
        logs.length,
        "FTA",
        "FTM",
        5
      ),
      ftPercentageSeason: traditionalPercentageAverage(
        logs,
        logs.length,
        "FTA",
        "FTM",
        logs.length
      ),
      fbPointsPercentageLast5: traditionalPercentageAverage(
        logs,
        logs.length,
        "FBPS",
        "PTS",
        5
      ),
      fbPointsPercentageSeason: traditionalPercentageAverage(
        logs,
        logs.length,
        "FBPS",
        "PTS",
        logs.length
      ),
      ftRateLast5: playerFTRateAvg(logs, logs.length, 5),
      ftRateSeason: playerFTRateAvg(logs, logs.length, logs.length),
      usgLast5: calculateUsgAverage(logs, teamData, teamName, logs.length, 5),
      usgSeason: calculateUsgAverage(
        logs,
        teamData,
        teamName,
        logs.length,
        logs.length
      ),
      efgLast5: calculateEFGAverage(logs, logs.length, 5),
      efgSeason: calculateEFGAverage(logs, logs.length, logs.length),
      tsLast5: calculateTSAverage(logs, logs.length, 5),
      tsSeason: calculateTSAverage(logs, logs.length, logs.length),
      pointsOffTOPercentageLast5: calcPointsOffTurnoversPercentage(
        logs,
        logs.length,
        5
      ),
      pointsOffTOPercentageSeason: calcPointsOffTurnoversPercentage(
        logs,
        logs.length,
        logs.length
      ),
      pointsInPaintPercentageLast5: calcPITPPercentage(logs, logs.length, 5),
      pointsInPaintPercentageSeason: calcPITPPercentage(
        logs,
        logs.length,
        logs.length
      ),
      oRebRateLast5: traditionalStatAverage(logs, logs.length, "OREB%", 5),
      oRebRateSeason: traditionalStatAverage(
        logs,
        logs.length,
        "OREB%",
        logs.length
      ),
      teamGameNumber: logs.length + 1,
      teamPaceLast5: calculateTeamPace(teamData, teamName, dateString, 5),
      teamPaceSeason: calculateTeamPace(teamData, teamName, dateString),
      teamOrtgLast5: calculateTeamOrtg(teamData, teamName, dateString, 5),
      teamOrtgSeason: calculateTeamOrtg(teamData, teamName, dateString),
      teamORebRateLast5: teamOReboundRateAvg(teamData, teamName, dateString, 5),
      teamORebRateSeason: teamOReboundRateAvg(teamData, teamName, dateString),
      teamPossessionsLast5: calculateTeamPossessions(
        teamData,
        teamName,
        dateString,
        5
      ),
      teamPossessionsSeason: calculateTeamPossessions(
        teamData,
        teamName,
        dateString
      ),
      oppTeamGameNumber: currentIndexOppTeam + 1,
      oppTeamPossessionsLast5: calculateTeamPossessions(
        teamData,
        opposingTeam,
        dateString,
        5
      ),
      oppTeamPossessionsSeason: calculateTeamPossessions(
        teamData,
        opposingTeam,
        dateString
      ),
      oppTeamPaceLast5: calculateTeamPace(
        teamData,
        opposingTeam,
        dateString,
        5
      ),
      oppTeamteamPaceSeason: calculateTeamPace(
        teamData,
        opposingTeam,
        dateString
      ),
      oppTeamPtsAllowedLast5: oppTeamPtsAllowedAvg(
        teamData,
        opposingTeam,
        dateString,
        5
      ),
      oppTeamPtsAllowedSeason: oppTeamPtsAllowedAvg(
        teamData,
        opposingTeam,
        dateString,
        logs.length
      ),
      oppTeamPitpAllowedLast5: oppTeamPITPAllowedAvg(
        teamData,
        opposingTeam,
        dateString,
        5
      ),
      oppTeamPitpAllowedSeason: oppTeamPITPAllowedAvg(
        teamData,
        opposingTeam,
        dateString,
        logs.length
      ),
      oppTeamDRebRateLast5: oppTeamDReboundRateAvg(
        teamData,
        opposingTeam,
        dateString,
        5
      ),
      oppTeamDRebRateSeason: oppTeamDReboundRateAvg(
        teamData,
        opposingTeam,
        dateString
      ),
      oppTeamFBPtsAllowedAvgLast5: oppTeamFbPointsAllowedAvg(
        teamData,
        opposingTeam,
        dateString,
        5
      ),
      oppTeamFBPtsAllowedAvgSeason: oppTeamFbPointsAllowedAvg(
        teamData,
        opposingTeam,
        dateString
      ),
      oppTeamFTRateAgainstLast5: oppTeamFTRateAgainstAvg(
        teamData,
        opposingTeam,
        dateString,
        5
      ),
      oppTeamFTRateAgainstSeason: oppTeamFTRateAgainstAvg(
        teamData,
        opposingTeam,
        dateString
      ),
      oppTeamDFGLast5: oppTeamDFGAvg(teamData, opposingTeam, dateString, 5),
      oppTeamDFGSeason: oppTeamDFGAvg(teamData, opposingTeam, dateString),
      oppTeamTORateLast5: oppTeamTORateAvg(
        teamData,
        opposingTeam,
        dateString,
        5
      ),
      oppTeamTORateSeason: oppTeamTORateAvg(
        teamData,
        opposingTeam,
        dateString,
        logs.length
      ),
      oppTeamThreesAttemptedAgainstPercentLast5:
        oppTeamPercentThreesTakenAgainstAvg(
          teamData,
          opposingTeam,
          dateString,
          5
        ),
      oppTeamThreesAttemptedAgainstPercentSeason:
        oppTeamPercentThreesTakenAgainstAvg(teamData, opposingTeam, dateString),
      oppTeam3paRelativeAgainstAvgLast5: oppTeam3paAgainstRelativeAvg(
        teamData,
        opposingTeam,
        dateString,
        5
      ),
      oppTeam3paRelativeAgainstAvgSeason: oppTeam3paAgainstRelativeAvg(
        teamData,
        opposingTeam,
        dateString
      ),
      oppTeam3pPercentRelativeAgainstAvgLast5:
        oppTeam3pPercentAgainstRelativeAvg(
          teamData,
          opposingTeam,
          dateString,
          5
        ),
      oppTeam3pPercentRelativeAgainstAvgSeason:
        oppTeam3pPercentAgainstRelativeAvg(teamData, opposingTeam, dateString),
      oppTeamDfgPercentRelativeAgainstAvgLast5:
        oppTeamFgPercentAgainstRelativeAvg(
          teamData,
          opposingTeam,
          dateString,
          5
        ),
      oppTeamDfgPercentRelativeAgainstAvgSeason:
        oppTeamFgPercentAgainstRelativeAvg(teamData, opposingTeam, dateString),
      oppTeamDrtgRelativeAgainstAvgLast5: oppTeamDrtgAgainstRelativeAvg(
        teamData,
        opposingTeam,
        dateString,
        5
      ),
      oppTeamDrtgRelativeAgainstAvgSeason: oppTeamDrtgAgainstRelativeAvg(
        teamData,
        opposingTeam,
        dateString
      ),
    },
  ];

  return playerFeatures;
};

//add offensive impace value if a player has a missing game and also matchup:missing

export const calculateAllPlayerFeatures = async (
  seasonData,
  teamData,
  lastYearLogs,
  lastLastYearLogs,
  lastYear,
  lastLastYear,
  biosData
) => {
  const allPlayerData = seasonData;
  const injuredPlayers = await getInjuryReport();
  const pointLinesData = await getPointLines();
  const injuredPlayerNames = injuredPlayers
    .filter((player) => player.status === "Out")
    .map((data) => data.player);
  const normalizedInjuredPlayerNames = injuredPlayerNames.map(normalizeText);
  console.log(normalizedInjuredPlayerNames);
  // const playerData = allPlayerData.filter(
  //   (player) => player.name === "Damian Lillard"
  // );

  try {
    const allPlayerFeatures = [];
    for (const playerData of allPlayerData) {
      try {
        const playerFeatures = calculatePlayerFeatures(
          playerData,
          seasonData,
          teamData,
          lastYearLogs,
          lastLastYearLogs,
          lastYear,
          lastLastYear,
          biosData,
          normalizedInjuredPlayerNames,
          pointLinesData
        );
        allPlayerFeatures.push(playerFeatures);
      } catch (error) {
        console.log(
          `${playerData[0].name} ${playerData[0]} has this error... ${error}`
        );
      }
    }
    const playersWithLines = allPlayerFeatures.filter(
      (data) =>
        !normalizedInjuredPlayerNames.includes(
          normalizeText(data[0].playerName)
        )
    );
    const formattedFeatures = playersWithLines.map((array) => {
      const [firstObj, secondObj] = array; // Destructure the array
      if (!secondObj) return [firstObj]; // If no second object, return the first object

      // Extract values from the second object excluding keys opp, team, and date
      const filteredValues = Object.entries(secondObj)
        .filter(([key]) => !["opp", "team", "date"].includes(key))
        .map(([, value]) => value);

      return [firstObj, filteredValues]; // Return the modified structure
    });

    console.log("season done");
    return formattedFeatures;
  } catch (error) {
    console.log(error);
  }

  // const playerFeatures = calculatePlayerFeatures(
  //   playerData,
  //   teamData,
  //   lastYearLogs,
  //   lastLastYearLogs,
  //   lastYear,
  //   lastLastYear
  // );
};

const postDataToGoogleSheet = async (data) => {
  const url =
    "https://script.google.com/macros/s/AKfycbz8uNxOh84AHlu0rHMHQmWLjeRleFsY6h4oQywge6GXrycJDYz_9QS9WBt0cXB38QEgSg/exec"; // Replace with your actual web app URL

  try {
    // Send POST request
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Response:", response.data); // Log the response from Google Apps Script
  } catch (error) {
    console.error("Error posting data:", error);
  }
};

export const calculateAndUpdate = async () => {
  const filePath = path.join(
    __dirname,
    "../Data/GameLogs/playerDataToday.json"
  );
  const jsonData = await fs.promises.readFile(filePath, { encoding: "utf8" });
  const allPlayersData = JSON.parse(jsonData);
  const playerFeatures = await calculateAllPlayerFeatures(
    allPlayersData,
    testTeamData,
    testJSONLastSeason,
    testJSONLastLastSeason,
    "2024",
    "2023",
    testBiosData
  );
  const allPredictedPoints = [];

  for (const playerData of playerFeatures) {
    const predictedPoints1 = await runModel1(playerData[1]);
    const predictedPoints2 = await runModel2(playerData[1]);
    // const predictedPoints3 = await runModel3(playerData[1]);
    allPredictedPoints.push({
      name: playerData[0].playerName,
      team: playerData[0].team,
      opponent: playerData[0].opponent,
      prizePicksLine: playerData[0].prizePicksLine,
      predictedPoints1,
      predictedPoints2,
      delta1: predictedPoints1 - playerData[0].prizePicksLine,
      delta2: predictedPoints2 - playerData[0].prizePicksLine,
    });
  }
  const predictedPointsWithLines = allPredictedPoints
    .filter((data) => data.prizePicksLine)
    .sort((a, b) => b.delta2 - a.delta2); // Sort descending by delta2

  postDataToGoogleSheet(predictedPointsWithLines);
  console.log(playerFeatures);
};

// test();
