import testData from "../../Data/playerBoxScores.js";
// import testInitialData from "../../Data/GameLogs/test.js";
import testTeamData from "../../Data/GameLogs/13-14.js";
import testJSON from "../../Data/GameLogs/2013-14.json" assert { type: "json" };
import testJSONLastSeason from "../../Data/GameLogs/2012-13.json" assert { type: "json" };
import testJSONLastLastSeason from "../../Data/GameLogs/2011-12.json" assert { type: "json" };
import testBiosData from "../../Data/GameLogs/playerBios-2013-14.js";
import { chromium } from "playwright-extra";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getEligiblePlayers } from "./getEligiblePlayers.js";
import {
  ppgLastSeason,
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
} from "../../Formulas/featuresPerGame.js";
import { sleep } from "../../Helpers/sleep.js";
import { playerBoxScoreData } from "./scrapers/playerBoxScoreData.js";

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
  biosData
) => {
  const playerFeatures = logs.map((game, index) => {
    const matchDescArr = game.MATCHUP.split(" - ");
    const date = new Date(matchDescArr[0]);
    const dateString = date.toDateString();
    const teamName = matchDescArr[1].split(" ")[0];
    const opposingTeam = matchDescArr[1].split(" ")[2];
    const homeAway = matchDescArr[1].split(" ")[1];
    const height = parseFloat(
      game.height.split(" ")[1].match(/\d+(\.\d+)?/)[0]
    );
    const weight = parseFloat(game.weight.split(" ")[1].replace(/[^\d.]/g, ""));
    const teamGames = teamData.filter((game) => game.TEAM === teamName);
    const oppTeamGames = teamData.filter((game) => game.TEAM === opposingTeam);
    const currentIndexTeam = teamGames.findIndex((game) => {
      const gameDate = new Date(game.DATE);
      if (gameDate.toDateString() === dateString) {
        return true;
      }
      return false;
    });
    const currentIndexOppTeam = oppTeamGames.findIndex((game) => {
      const gameDate = new Date(game.DATE);
      if (gameDate.toDateString() === dateString) {
        return true;
      }
      return false;
    });
    return {
      daysSinceLastGame: daysSinceLastGamePlayed(logs, index),
      date: dateString,
      team: matchDescArr[1].split(" ")[0],
      opp: opposingTeam,
      height,
      weight,
      age: getPlayerAge(game.name, biosData),
      home: homeAway === "vs." ? 1 : 0,
      gamesPlayed: index,
      missingOffensiveValue: missingOffensiveValue(
        teamData,
        teamName,
        dateString,
        allPlayerLogs,
        []
      ),
      previousPPG: pointsAverageAfterDate(
        game.name,
        lastYearLogs,
        lastLastYearLogs,
        lastYear,
        lastLastYear,
        2,
        10
      ),
      ppgLast5: traditionalStatAverage(logs, index, "PTS", 5),
      ppgSeason: traditionalStatAverage(logs, index, "PTS", index),
      scoringVarianceSeason: scoringVariance(logs, index, index),
      scoringRateLast5: scoringRate(logs, index, 5),
      scoringRateSeason: scoringRate(logs, index, index),
      mpgLast5: traditionalStatAverage(logs, index, "MIN", 5),
      mpgSeason: traditionalStatAverage(logs, index, "MIN", index),
      fgaLast5: traditionalStatAverage(logs, index, "FGA", 5),
      fgaSeason: traditionalStatAverage(logs, index, "FGA", index),
      threesAttemptedLast5: traditionalStatAverage(logs, index, "3PA", 5),
      threesAttemptedSeason: traditionalStatAverage(logs, index, "3PA", index),
      threesMadePercentageLast5: traditionalPercentageAverage(
        logs,
        index,
        "3PA",
        "3PM",
        5
      ),
      threesMadePercentageSeason: traditionalPercentageAverage(
        logs,
        index,
        "3PA",
        "3PM",
        index
      ),
      ftPercentageLast5: traditionalPercentageAverage(
        logs,
        index,
        "FTA",
        "FTM",
        5
      ),
      ftPercentageSeason: traditionalPercentageAverage(
        logs,
        index,
        "FTA",
        "FTM",
        index
      ),
      fbPointsPercentageLast5: traditionalPercentageAverage(
        logs,
        index,
        "FBPS",
        "PTS",
        5
      ),
      fbPointsPercentageSeason: traditionalPercentageAverage(
        logs,
        index,
        "FBPS",
        "PTS",
        index
      ),

      ftRateLast5: playerFTRateAvg(logs, index, 5),
      ftRateSeason: playerFTRateAvg(logs, index, index),
      usgLast5: calculateUsgAverage(logs, index, 5),
      usgSeason: calculateUsgAverage(logs, index, index),
      efgLast5: calculateEFGAverage(logs, index, 5),
      efgSeason: calculateEFGAverage(logs, index, index),
      tsLast5: calculateTSAverage(logs, index, 5),
      tsSeason: calculateTSAverage(logs, index, index),
      pointsOffTOPercentageLast5: calcPointsOffTurnoversPercentage(
        logs,
        index,
        5
      ),
      pointsOffTOPercentageSeason: calcPointsOffTurnoversPercentage(
        logs,
        index,
        index
      ),
      pointsInPaintPercentageLast5: calcPITPPercentage(logs, index, 5),
      pointsInPaintPercentageSeason: calcPITPPercentage(logs, index, index),
      oRebRateLast5: traditionalStatAverage(logs, index, "OREB%", 5),
      oRebRateSeason: traditionalStatAverage(logs, index, "OREB%", index),
      teamGameNumber: currentIndexTeam + 1,
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
        index
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
        index
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
        index
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
      points: Number(game.PTS),
    };
  });

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
          biosData
        );
        allPlayerFeatures.push(playerFeatures);
      } catch (error) {
        console.log(
          `${playerData[0].name} ${playerData[0].MATCHUP} has this error... ${error}`
        );
      }
    }
    const formattedFeatures = allPlayerFeatures
      .flat(1)
      .map(({ opp, team, date, ...obj }) => Object.values(obj))
      .slice(4);
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

// const test = async () => {
//   const data = await calculateAllPlayerFeatures(
//     testJSON,
//     testTeamData,
//     testJSONLastSeason,
//     testJSONLastLastSeason,
//     "2019",
//     "2018",
//     testBiosData
//   );
//   console.log(data);
// };

// test();
