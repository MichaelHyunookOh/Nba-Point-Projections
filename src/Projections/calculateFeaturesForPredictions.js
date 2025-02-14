// import testInitialData from "../../Data/GameLogs/test.js";
import testTeamData from "../Data/GameLogs/currentGameLogs.js";
import fs from "fs";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import axios from "axios";
import jstat from "jstat";
// import testPlayerData from "../Data/GameLogs/playerDataToday.json" assert { type: "json" };
import testJSONLastSeason from "../Data/Training/2023-24.json" assert { type: "json" };
import testJSONLastLastSeason from "../Data/Training/2022-23.json" assert { type: "json" };
import testBiosData from "../Data/Training/playerBios-2024-25.js";
import path from "path";
import { fileURLToPath } from "url";
import { getPointLines } from "./propsScrapers/getPointLines.js";
import { getInjuryReport } from "./getInjuryReport.js";
import { normalizeText } from "./helpers/normalizeText.js";
import { runModel4 } from "./predictPoints4.js";
import { runModel2 } from "./predictPoints2.js";
import { runModel2V2 } from "./predictPoints2-v2.js";
import { runModel4v3 } from "./predictPoints4-v3.js";
import { runModel4v2 } from "./predictPoints4-v2.js";
import { runModel5 } from "./predictPoints5.js";
import { runModel5v2 } from "./predictPoints5-v2.js";
import { runModel6 } from "./predictPoints6.js";
import { runModel6v2 } from "./predictPoints6-v2.js";
import { runModel7 } from "./predictPoints7.js";
import { runModel7v2 } from "./predictPoints7-v2.js";
import { runModel4v2WithUncertainty } from "./predictPoints4Quantile.js";
import { storePlayerLines } from "../storePrizePicksLines.js";
import {
  ppgLastSeason,
  daysSinceLastGamePlayedCurrent,
  addDNPLogs,
  missingOffensiveValue,
  weightedTraditionalStatAverage,
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
  pointLinesData,
  gamesBackWindowPlayer = false,
  gamesBackWindowTeams = false
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
  const teamName = playerLineData[0]?.team;
  const opposingTeam = playerLineData[0]?.opponent.split(" ")[1];
  const numGamesBackPlayer = gamesBackWindowPlayer || logs.length;
  const numGamesBackTeam = gamesBackWindowTeams || false;

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
      previousPPG: 0,
      ppgExpDecay: weightedTraditionalStatAverage(
        logs,
        logs.length,
        "PTS",
        0.2
      ),
      ppgLast5: traditionalStatAverage(logs, logs.length, "PTS", 5),
      ppgSeason: traditionalStatAverage(
        logs,
        logs.length,
        "PTS",
        numGamesBackPlayer
      ),
      scoringVarianceSeason: scoringVariance(
        logs,
        logs.length,
        numGamesBackPlayer
      ),
      scoringRateLast5: scoringRate(logs, logs.length, 5),
      scoringRateSeason: scoringRate(logs, logs.length, numGamesBackPlayer),
      mpgLast5: traditionalStatAverage(logs, logs.length, "MIN", 5),
      mpgSeason: traditionalStatAverage(
        logs,
        logs.length,
        "MIN",
        numGamesBackPlayer
      ),
      fgaLast5: traditionalStatAverage(logs, logs.length, "FGA", 5),
      fgaSeason: traditionalStatAverage(
        logs,
        logs.length,
        "FGA",
        numGamesBackPlayer
      ),
      threesAttemptedLast5: traditionalStatAverage(logs, logs.length, "3PA", 5),
      threesAttemptedSeason: traditionalStatAverage(
        logs,
        logs.length,
        "3PA",
        numGamesBackPlayer
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
        numGamesBackPlayer
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
        numGamesBackPlayer
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
        numGamesBackPlayer
      ),
      ftRateLast5: playerFTRateAvg(logs, logs.length, 5),
      ftRateSeason: playerFTRateAvg(logs, logs.length, numGamesBackPlayer),
      usgLast5: calculateUsgAverage(logs, teamData, teamName, logs.length, 5),
      usgSeason: calculateUsgAverage(
        logs,
        teamData,
        teamName,
        logs.length,
        numGamesBackPlayer
      ),
      efgLast5: calculateEFGAverage(logs, logs.length, 5),
      efgSeason: calculateEFGAverage(logs, logs.length, numGamesBackPlayer),
      tsLast5: calculateTSAverage(logs, logs.length, 5),
      tsSeason: calculateTSAverage(logs, logs.length, numGamesBackPlayer),
      pointsOffTOPercentageLast5: calcPointsOffTurnoversPercentage(
        logs,
        logs.length,
        5
      ),
      pointsOffTOPercentageSeason: calcPointsOffTurnoversPercentage(
        logs,
        logs.length,
        numGamesBackPlayer
      ),
      pointsInPaintPercentageLast5: calcPITPPercentage(logs, logs.length, 5),
      pointsInPaintPercentageSeason: calcPITPPercentage(
        logs,
        logs.length,
        numGamesBackPlayer
      ),
      oRebRateLast5: traditionalStatAverage(logs, logs.length, "OREB%", 5),
      oRebRateSeason: traditionalStatAverage(
        logs,
        logs.length,
        "OREB%",
        numGamesBackPlayer
      ),
      teamGameNumber: logs.length + 1,
      teamPaceLast5: calculateTeamPace(teamData, teamName, dateString, 5),
      teamPaceSeason: calculateTeamPace(
        teamData,
        teamName,
        dateString,
        numGamesBackTeam
      ),
      teamOrtgLast5: calculateTeamOrtg(teamData, teamName, dateString, 5),
      teamOrtgSeason: calculateTeamOrtg(
        teamData,
        teamName,
        dateString,
        numGamesBackTeam
      ),
      teamORebRateLast5: teamOReboundRateAvg(teamData, teamName, dateString, 5),
      teamORebRateSeason: teamOReboundRateAvg(
        teamData,
        teamName,
        dateString,
        numGamesBackTeam
      ),
      teamPossessionsLast5: calculateTeamPossessions(
        teamData,
        teamName,
        dateString,
        5
      ),
      teamPossessionsSeason: calculateTeamPossessions(
        teamData,
        teamName,
        dateString,
        numGamesBackTeam
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
        dateString,
        numGamesBackTeam
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
        dateString,
        numGamesBackTeam
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
        numGamesBackTeam
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
        numGamesBackTeam
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
        dateString,
        numGamesBackTeam
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
        dateString,
        numGamesBackTeam
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
        dateString,
        numGamesBackTeam
      ),
      oppTeamDFGLast5: oppTeamDFGAvg(teamData, opposingTeam, dateString, 5),
      oppTeamDFGSeason: oppTeamDFGAvg(
        teamData,
        opposingTeam,
        dateString,
        numGamesBackTeam
      ),
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
        numGamesBackTeam
      ),
      oppTeamThreesAttemptedAgainstPercentLast5:
        oppTeamPercentThreesTakenAgainstAvg(
          teamData,
          opposingTeam,
          dateString,
          5
        ),
      oppTeamThreesAttemptedAgainstPercentSeason:
        oppTeamPercentThreesTakenAgainstAvg(
          teamData,
          opposingTeam,
          dateString,
          numGamesBackTeam
        ),
      oppTeam3paRelativeAgainstAvgLast5: oppTeam3paAgainstRelativeAvg(
        teamData,
        opposingTeam,
        dateString,
        5
      ),
      oppTeam3paRelativeAgainstAvgSeason: oppTeam3paAgainstRelativeAvg(
        teamData,
        opposingTeam,
        dateString,
        numGamesBackTeam
      ),
      oppTeam3pPercentRelativeAgainstAvgLast5:
        oppTeam3pPercentAgainstRelativeAvg(
          teamData,
          opposingTeam,
          dateString,
          5
        ),
      oppTeam3pPercentRelativeAgainstAvgSeason:
        oppTeam3pPercentAgainstRelativeAvg(
          teamData,
          opposingTeam,
          dateString,
          numGamesBackTeam
        ),
      oppTeamDfgPercentRelativeAgainstAvgLast5:
        oppTeamFgPercentAgainstRelativeAvg(
          teamData,
          opposingTeam,
          dateString,
          5
        ),
      oppTeamDfgPercentRelativeAgainstAvgSeason:
        oppTeamFgPercentAgainstRelativeAvg(
          teamData,
          opposingTeam,
          dateString,
          numGamesBackTeam
        ),
      oppTeamDrtgRelativeAgainstAvgLast5: oppTeamDrtgAgainstRelativeAvg(
        teamData,
        opposingTeam,
        dateString,
        5
      ),
      oppTeamDrtgRelativeAgainstAvgSeason: oppTeamDrtgAgainstRelativeAvg(
        teamData,
        opposingTeam,
        dateString,
        numGamesBackTeam
      ),
      fgmLast5: traditionalStatAverage(logs, logs.length, "FGM", 5),
      fgmSeason: traditionalStatAverage(
        logs,
        logs.length,
        "FGM",
        numGamesBackPlayer
      ),
      ftmLast5: traditionalStatAverage(logs, logs.length, "FTM", 5),
      ftmSeason: traditionalStatAverage(
        logs,
        logs.length,
        "FTM",
        numGamesBackPlayer
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
  biosData,
  gamesBackWindowPlayer,
  gamesBackWindowTeams
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
          pointLinesData,
          gamesBackWindowPlayer,
          gamesBackWindowTeams
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
    // console.log(playersWithLines);
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
    testBiosData,
    10,
    20
  );
  const allPredictedPoints = [];

  // console.log(playerFeatures);

  for (const playerData of playerFeatures) {
    // const {
    //   prediction_q50,
    //   prediction_q25,
    //   prediction_q75,
    //   uncertainty,
    //   certaintyPercentage,
    //   std_prediction,
    // } = await runModel4v2WithUncertainty(playerData[1]);
    const predictedPoints1 = await runModel7(playerData[1]);
    const predictedPoints2 = await runModel7v2(playerData[1]);
    // const predictedPoints2 = await runModel2(playerData[1]);
    // const predictedPoints3 = await runModel4v2(playerData[1]);
    // const probabilityUnder = jstat.normal.cdf(
    //   playerData[0].prizePicksLine,
    //   prediction_q50,
    //   std_prediction
    // );
    // const probabilityOver = 1 - probabilityUnder;
    allPredictedPoints.push({
      name: playerData[0].playerName,
      team: playerData[0].team,
      opponent: playerData[0].opponent,
      prizePicksLine: playerData[0].prizePicksLine,
      predictedPoints1,
      delta1: predictedPoints1 - playerData[0].prizePicksLine,
      predictedPoints2,
      delta2: predictedPoints2 - playerData[0].prizePicksLine,
    });
  }
  const predictedPointsWithLines = allPredictedPoints
    .filter((data) => data.prizePicksLine)
    .sort((a, b) => b.delta1 - a.delta1); // Sort descending by delta2
  postDataToGoogleSheet(predictedPointsWithLines);
  storePlayerLines(predictedPointsWithLines);
};

// test();
