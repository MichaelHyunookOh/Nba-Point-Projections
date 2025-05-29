// import testInitialData from "../../Data/GameLogs/test.js";
import testTeamData from "../Data/Training/17-18.js";
import testJSON from "../Data/Training/2017-18.json" assert { type: "json" };
// import testJSONLastSeason from "../../Data/GameLogs/2012-13.json" assert { type: "json" };
// import testJSONLastLastSeason from "../../Data/GameLogs/2011-12.json" assert { type: "json" };
import testBiosData from "../Data/Training/playerBios-2017-18.js";
import { chromium } from "playwright-extra";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getEligiblePlayers } from "./scrapers/getEligiblePlayers.js";
import {
  ppgLastSeason,
  addDNPLogs,
  weightedTraditionalStatAverage,
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
  oppTeamRelativeStat,
  calculateEPPAverage,
} from "../Formulas/featuresPerGame.js";
import { sleep } from "../Helpers/sleep.js";
import { playerBoxScoreData } from "./scrapers/playerBoxScoreData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const calculatePlayerFeatures = (
  logs,
  allPlayerLogs,
  teamData,
  biosData,
  gamesBackWindowPlayer = false,
  gamesBackWindowTeams = false
) => {
  const playerFeatures = logs.map((game, index) => {
    const matchDescArr = game.MATCHUP.split(" - ");
    const date = new Date(matchDescArr[0]);
    const dateString = date.toDateString();
    const teamName = matchDescArr[1].split(" ")[0];
    const opposingTeam = matchDescArr[1].split(" ")[2];
    const homeAway = matchDescArr[1].split(" ")[1];
    const numGamesBackPlayer = gamesBackWindowPlayer || index;
    const numGamesBackTeam = gamesBackWindowTeams || false;
    // const height = parseFloat(
    //   game.height.split(" ")[1].match(/\d+(\.\d+)?/)[0]
    // );
    // const weight = parseFloat(game.weight.split(" ")[1].replace(/[^\d.]/g, ""));
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
      height: 0,
      weight: 0,
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
      previousPPG: 0,
      ppgLast5: traditionalStatAverage(logs, index, "PTS", 5),
      ppgSeason: traditionalStatAverage(logs, index, "PTS", numGamesBackPlayer),
      scoringVarianceSeason: scoringVariance(logs, index, numGamesBackPlayer),
      scoringRateLast5: scoringRate(logs, index, 5),
      scoringRateSeason: scoringRate(logs, index, numGamesBackPlayer),
      mpgLast5: traditionalStatAverage(logs, index, "MIN", 5),
      mpgSeason: traditionalStatAverage(logs, index, "MIN", numGamesBackPlayer),
      fgaLast5: traditionalStatAverage(logs, index, "FGA", 5),
      fgaSeason: traditionalStatAverage(logs, index, "FGA", numGamesBackPlayer),
      threesAttemptedLast5: traditionalStatAverage(logs, index, "3PA", 5),
      threesAttemptedSeason: traditionalStatAverage(
        logs,
        index,
        "3PA",
        numGamesBackPlayer
      ),
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
        numGamesBackPlayer
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
        numGamesBackPlayer
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
        numGamesBackPlayer
      ),
      ftRateLast5: playerFTRateAvg(logs, index, 5),
      ftRateSeason: playerFTRateAvg(logs, index, numGamesBackPlayer),
      usgLast5: calculateUsgAverage(logs, teamData, teamName, index, 5),
      usgSeason: calculateUsgAverage(
        logs,
        teamData,
        teamName,
        index,
        numGamesBackPlayer
      ),
      efgLast5: calculateEFGAverage(logs, index, 5),
      efgSeason: calculateEFGAverage(logs, index, numGamesBackPlayer),
      tsLast5: calculateTSAverage(logs, index, 5),
      tsSeason: calculateTSAverage(logs, index, numGamesBackPlayer),
      pointsOffTOPercentageLast5: calcPointsOffTurnoversPercentage(
        logs,
        index,
        5
      ),
      pointsOffTOPercentageSeason: calcPointsOffTurnoversPercentage(
        logs,
        index,
        numGamesBackPlayer
      ),
      pointsInPaintPercentageLast5: calcPITPPercentage(logs, index, 5),
      pointsInPaintPercentageSeason: calcPITPPercentage(
        logs,
        index,
        numGamesBackPlayer
      ),
      oRebRateLast5: traditionalStatAverage(logs, index, "OREB%", 5),
      oRebRateSeason: traditionalStatAverage(
        logs,
        index,
        "OREB%",
        numGamesBackPlayer
      ),
      teamGameNumber: currentIndexTeam + 1,
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
      fgmLast5: traditionalStatAverage(logs, index, "FGM", 5),
      fgmSeason: traditionalStatAverage(logs, index, "FGM", numGamesBackPlayer),
      ftmLast5: traditionalStatAverage(logs, index, "FTM", 5),
      ftmSeason: traditionalStatAverage(logs, index, "FTM", numGamesBackPlayer),
      ppgExpDecay1: weightedTraditionalStatAverage(logs, index, "PTS", 0.05),
      ppgExpDecay2: weightedTraditionalStatAverage(logs, index, "PTS", 0.07),
      ppgExpDecay3: weightedTraditionalStatAverage(logs, index, "PTS", 0.09),
      ppgExpDecay4: weightedTraditionalStatAverage(logs, index, "PTS", 0.1),
      fgaExpDecay1: weightedTraditionalStatAverage(logs, index, "FGA", 0.1),
      fgaExpDecay2: weightedTraditionalStatAverage(logs, index, "FGA", 0.2),
      oppTeamRelativeDrtg: oppTeamRelativeStat(
        teamData,
        opposingTeam,
        dateString,
        "DEFRTG"
      ),
      epp1: calculateEPPAverage(logs, teamData, index, 0.05),
      epp2: calculateEPPAverage(logs, teamData, index, 0.07),
      epp3: calculateEPPAverage(logs, teamData, index, 0.1),
      ftaExpDecay1: weightedTraditionalStatAverage(logs, index, "FTA", 0.1),
      ftaExpDecay2: weightedTraditionalStatAverage(logs, index, "FTA", 0.2),
      minExpDecay1: weightedTraditionalStatAverage(logs, index, "MIN", 0.1),
      minExpDecay2: weightedTraditionalStatAverage(logs, index, "MIN", 0.2),
      trend:
        calculateEPPAverage(logs, teamData, index, 0.05) -
        calculateEPPAverage(logs, teamData, index, 0.1),
      momentum_ratio:
        calculateEPPAverage(logs, teamData, index, 0.05) /
        calculateEPPAverage(logs, teamData, index, 0.1),
      hot_streak:
        calculateEPPAverage(logs, teamData, index, 0.05) >
          calculateEPPAverage(logs, teamData, index, 0.07) &&
        calculateEPPAverage(logs, teamData, index, 0.07) >
          calculateEPPAverage(logs, teamData, index, 0.1)
          ? 1
          : 0,
      oppTeamRelativePace: oppTeamRelativeStat(
        teamData,
        opposingTeam,
        dateString,
        "PACE"
      ),
      oppTeamRelativePaintPtsAllowed: oppTeamRelativeStat(
        teamData,
        opposingTeam,
        dateString,
        "OPPPITP"
      ),
      epp5: calculateEPPAverage(logs, teamData, index, 0.03),
      epp6: calculateEPPAverage(logs, teamData, index, 0.01),
      points: Number(game.PTS),
    };
  });

  return playerFeatures;
};

//add offensive impace value if a player has a missing game and also matchup:missing

export const calculateAllPlayerFeatures = async (
  seasonData,
  teamData,
  biosData,
  gamesBackWindowPlayer,
  gamesBackWindowTeams
) => {
  const allPlayerData = seasonData;
  // const playerDataAll = allPlayerData.filter(
  //   (player) => player[0].name === "Damian Lillard"
  // );

  try {
    const allPlayerFeatures = [];
    for (const playerData of allPlayerData) {
      try {
        const playerFeatures = calculatePlayerFeatures(
          playerData,
          allPlayerData,
          teamData,
          biosData,
          gamesBackWindowPlayer,
          gamesBackWindowTeams
        );
        allPlayerFeatures.push(playerFeatures);
      } catch (error) {
        console.log(
          `${playerData[0].name} ${playerData[0].MATCHUP} has this error... ${error}`
        );
        const stackLines = error.stack.split("\n");
        if (stackLines.length > 1) {
          // The second line in the stack trace usually contains the file and line number
          const relevantLine = stackLines[1].trim();
          console.error("Error occurred at:", relevantLine);
        }
      }
    }
    // console.log(allPlayerFeatures);
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
//     testBiosData,
//     10,
//     20
//   );
//   console.log(data);
// };

// test();
