import { normalizeText } from "../Projections/helpers/normalizeText.js";
export const daysSinceLastGamePlayed = (games, currentIndex) => {
  if (currentIndex <= 0) {
    return 0; // If it's the first game, return 0 days since last game
  }
  const currentGameDate = new Date(games[currentIndex].MATCHUP.split(" - ")[0]); // Current game's date
  const lastGameDate = new Date(
    games[currentIndex - 1].MATCHUP.split(" - ")[0]
  ); // Last game's dategames including the current one
  // Calculate the difference in time (in milliseconds)
  const timeDiff = currentGameDate - lastGameDate;

  // Convert milliseconds to days
  const daysSinceLastGame = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  return daysSinceLastGame >= 0 ? daysSinceLastGame : 0; // Ensure it's not negative
};

export const daysSinceLastGamePlayedCurrent = (
  games,
  currentIndex,
  todaysDate
) => {
  if (currentIndex <= 0) {
    return 0; // If it's the first game, return 0 days since last game
  }
  const currentGameDate = new Date(todaysDate); // Current game's date
  const lastGameDate = new Date(games[currentIndex].MATCHUP.split(" - ")[0]); // Last game's dategames including the current one
  // Calculate the difference in time (in milliseconds)
  const timeDiff = currentGameDate - lastGameDate;

  // Convert milliseconds to days
  const daysSinceLastGame = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  return daysSinceLastGame >= 0 ? daysSinceLastGame : 0; // Ensure it's not negative
};

function parseDate(dateStr) {
  const date = new Date(dateStr);
  const dateString = date.toDateString();
  return dateString;
}

export const addDNPLogs = (playersData, teamData) => {
  return playersData
    .map((playerGames) => {
      const teamsPlayedOn = [
        ...new Set(
          playerGames.map((game) => game.MATCHUP.split(" - ")[1].split(" ")[0])
        ),
      ];

      return teamsPlayedOn.map((team) => {
        const teamGamesPlayed = playerGames
          .filter((game) => game.MATCHUP.split(" - ")[1].split(" ")[0] === team)
          .map((game) => parseDate(game.MATCHUP.split(" - ")[0]));

        const teamGames = teamData
          .filter((game) => game.TEAM === team)
          .map((game) => parseDate(game.DATE));

        const missingDates = teamGames.filter(
          (date) => !teamGamesPlayed.includes(date)
        );

        return {
          player: playerGames[0]?.name || "Unknown Player",
          team,
          missingDates,
        };
      });
    })
    .flat();
};

function calculatePlayerOffensiveValue(playerGames, targetGameDate) {
  const targetDate = new Date(targetGameDate);
  let totalPoints = 0;
  let totalFGA = 0;
  let totalMinutes = 0;
  let totalUsage = 0;
  let gamesPlayed = 0;
  const playerLogs = playerGames.flat(2);

  if (playerLogs.length === 0) {
    console.warn(`No logs for player, assuming no games played.`);
    return 0;
  }

  // console.log(playerGames);

  playerGames.forEach((log) => {
    // console.log(playerLogArray);
    const logDate = new Date(log.MATCHUP.split(" - ")[0]); // Parse the game date from MATCHUP

    if (logDate.getTime() < targetDate.getTime()) {
      // Only include games before the target date
      totalPoints += parseFloat(log.PTS || 0); // Ensure valid data
      totalFGA += parseFloat(log.FGA || 0); // Ensure valid data
      totalMinutes += parseFloat(log.MIN || 0); // Ensure valid data
      totalUsage += parseFloat(log["USG%"] || 0); // Ensure valid data
      gamesPlayed++;
    }
  });

  // If the player hasn't played any games by the target date, return 0
  if (gamesPlayed === 0) {
    return 0;
  }

  // Calculate averages based on games played up to the target date
  const avgPTS = totalPoints / gamesPlayed;
  const avgFGA = totalFGA / gamesPlayed;
  const avgMIN = totalMinutes / gamesPlayed;
  const avgUSG = totalUsage / gamesPlayed;

  if (avgMIN === 0) {
    return 0; // Return 0 if avgMIN is zero to avoid division by zero
  }

  // Calculate offensive value based on the provided formula
  return avgPTS * (avgFGA / avgMIN) * (avgUSG / 100);
}

export const missingOffensiveValue = (
  allTeamGames,
  teamName,
  gameDate,
  allPlayerLogs,
  injuryReport = []
) => {
  const targetDate = new Date(gameDate);
  let totalMissingOffensiveValue = 0;

  // Step 1: Map team games by date for quick lookup
  const teamGamesMap = allTeamGames
    .filter((game) => game.TEAM === teamName)
    .reduce((map, game) => {
      map[new Date(game.DATE).getTime()] = true;
      return map;
    }, {});

  // Step 2: Filter allPlayerLogs for players on the same team
  const teamPlayerLogs = allPlayerLogs.filter((playerLogs) =>
    playerLogs.some((log) => {
      const playerTeam = log.MATCHUP.split(" - ")[1].split(" ")[0];
      return playerTeam === teamName;
    })
  );

  // Step 3: Calculate missing or returning offensive value for each player
  teamPlayerLogs.forEach((playerLogs) => {
    const playerName = playerLogs[0]?.name || "";
    const totalOffensiveValue = calculatePlayerOffensiveValue(
      playerLogs,
      gameDate
    );

    // Identify if player is absent today based on injury report
    const playerIsAbsentToday = injuryReport.includes(
      normalizeText(playerName)
    );

    // Check if the player played on the team's game date
    const playerPlayedOnDate = playerLogs.some((log) => {
      const logDate = new Date(log.MATCHUP.split(" - ")[0]).getTime();
      return logDate === targetDate.getTime();
    });

    // Handle cases where the player has switched teams
    const playerOnDifferentTeam = !playerLogs.some((log) => {
      const playerTeam = log.MATCHUP.split(" - ")[1].split(" ")[0];
      return playerTeam === teamName;
    });

    // Get the last 5 games before the target date
    const last5Games = playerLogs
      .filter((log) => new Date(log.MATCHUP.split(" - ")[0]) < targetDate)
      .slice(-5);

    // Count games missed in the last 5 games
    const gamesMissedCount = last5Games.filter((log) => {
      const logDate = new Date(log.MATCHUP.split(" - ")[0]).getTime();
      return !teamGamesMap[logDate]; // Game is missing for the player
    }).length;

    // Step 4: Apply decay factor
    const missDecay = Math.max(0, 1 - gamesMissedCount / 5);

    // Step 5: Subtract offensive value if the player is absent
    if (
      playerIsAbsentToday ||
      (!playerPlayedOnDate && !playerOnDifferentTeam)
    ) {
      totalMissingOffensiveValue -= totalOffensiveValue * missDecay;
    }

    // Step 6: Add offensive value back if the player is returning
    if (!playerIsAbsentToday && gamesMissedCount > 0) {
      const returnDecay = Math.max(0, 1 - gamesMissedCount / 5);
      totalMissingOffensiveValue += totalOffensiveValue * returnDecay;
    }
  });

  // Step 7: Return rounded value
  return parseFloat(totalMissingOffensiveValue.toFixed(2));
};

export const getPlayerAge = (playerName, biosData) => {
  // Find the player's bio data by name
  const playerBio = biosData.find((bio) => bio.PLAYER === playerName);

  // If player is found, return their age; otherwise, return a message or null
  return playerBio
    ? parseFloat(playerBio.AGE)
    : `Age not found for player ${playerName}`;
};

export const ppgLastSeason = (previousYearGames, name) => {
  const playerLogs = previousYearGames.filter((game) => game.name === name);
  let total = 0;
  if (!playerLogs) {
    return 0;
  }
  if (playerLogs.length > 40) {
    const moreGameToConsider = playerLogs.slice(
      playerLogs.length - 41,
      playerLogs.length - 1
    );
    total = moreGameToConsider.reduce(
      (sum, game) => sum + parseFloat(game.PTS),
      0
    );
    return parseFloat((total / moreGameToConsider.length).toFixed(2));
  }

  total = playerLogs.reduce((sum, game) => sum + parseFloat(game.PTS), 0);
  return parseFloat((total / playerLogs.length).toFixed(2)); // Calculate the PPG
};

export const scoringVariance = (games, currentIndex, gamesBack) => {
  const start = Math.max(0, currentIndex - gamesBack); // Start index to get the specified number of games back
  const gamesToConsider = games.slice(start, currentIndex); // Slice the last 'gamesBack' games

  // Return 0 variance if there are no games to consider
  if (gamesToConsider.length === 0) return 0;

  // Calculate the mean (average) for the specified stat
  const mean =
    gamesToConsider.reduce((sum, game) => sum + parseFloat(game["PTS"]), 0) /
    gamesToConsider.length;

  // Calculate variance based on the squared differences from the mean
  const variance =
    gamesToConsider.reduce((sum, game) => {
      const diff = parseFloat(game["PTS"]) - mean;
      return sum + diff * diff;
    }, 0) / gamesToConsider.length;
  const standardDeviation = Math.sqrt(variance);

  return parseFloat(standardDeviation.toFixed(2)); // Round the variance to two decimal places
};

export const scoringRate = (games, currentIndex, gamesBack) => {
  // Calculate the starting index to consider only the past `gamesBack` games
  const start = Math.max(0, currentIndex - gamesBack);
  const gamesToConsider = games.slice(start, currentIndex);

  // Calculate total points and total minutes over the games being considered
  const { totalPoints, totalMinutes } = gamesToConsider.reduce(
    (totals, game) => {
      totals.totalPoints += parseFloat(game.PTS);
      totals.totalMinutes += parseFloat(game.MIN);
      return totals;
    },
    { totalPoints: 0, totalMinutes: 0 }
  );

  // If no minutes were played (to avoid division by zero), return 0
  if (totalMinutes === 0) return 0;

  // Calculate scoring rate as points per minute
  return parseFloat((totalPoints / totalMinutes).toFixed(2));
};

export const pointsAverageAfterDate = (
  playerName,
  lastYearGames,
  lastLastYearGames,
  lastYear,
  lastLastYear,
  month,
  day
) => {
  const lastYearGamesExist = lastYearGames
    .flat(2)
    .some((game) => game.name === playerName);
  const lastLastYearGamesExist = lastYearGames
    .flat(2)
    .some((game) => game.name === playerName);
  if (!lastYearGamesExist && !lastLastYearGamesExist) {
    return 0;
  }
  const games =
    lastYearGames.flat(2).filter((game) => game.name === playerName) ||
    lastLastYearGames.flat(2).filter((game) => game.name === playerName);
  // Define the cutoff date based on month and day
  const cutoffDate = new Date(
    lastYearGamesExist ? lastYear : lastLastYear,
    month - 1,
    day
  );

  // Filter games that occur on or after the cutoff date
  const gamesAfterDate = games.filter((game) => {
    const gameDate = new Date(game.MATCHUP.split(" - ")[0]); // Assumes MATCHUP field contains date as "YYYY-MM-DD - ... "
    return gameDate >= cutoffDate;
  });

  // If there are no games after the specified date, return 0
  if (gamesAfterDate.length === 0) return 0;

  // Calculate total points for the filtered games
  const totalPoints = gamesAfterDate.reduce(
    (sum, game) => sum + parseFloat(game.PTS),
    0
  );

  // Calculate the average points per game
  return parseFloat((totalPoints / gamesAfterDate.length).toFixed(2));
};

export const traditionalStatAverage = (
  games,
  currentIndex,
  stat,
  gamesBack
) => {
  const start = Math.max(0, currentIndex - gamesBack); // Start index to get the last 5 games (or fewer if early in season)
  const gamesToConsider = games.slice(start, currentIndex); // Slice the last 5 games including the current one
  const total = gamesToConsider.reduce(
    (sum, game) => sum + parseFloat(game[stat]),
    0
  ); // Sum points of the last 5 games
  if (!total) {
    return 0;
  }
  return parseFloat((total / gamesToConsider.length).toFixed(2)); // Calculate the PPG
};

export const traditionalPercentageAverage = (
  games,
  currentIndex,
  attempts,
  makes,
  gamesBack
) => {
  const start = Math.max(0, currentIndex - gamesBack);
  const gamesToConsider = games.slice(start, currentIndex);
  const totalAttempts = gamesToConsider.reduce(
    (sum, game) => sum + parseFloat(game[attempts]),
    0
  );
  const totalMakes = gamesToConsider.reduce(
    (sum, game) => sum + parseFloat(game[makes]),
    0
  );
  if (!totalAttempts) {
    return 0;
  }
  return parseFloat((totalMakes / totalAttempts).toFixed(2));
};

export const playerFTRateAvg = (games, currentIndex, gamesBack) => {
  const start = Math.max(0, currentIndex - gamesBack);
  const gamesToConsider = games.slice(start, currentIndex);
  const totalFTA = gamesToConsider.reduce(
    (sum, game) => sum + parseFloat(game.FTA),
    0
  );
  const totalFGA = gamesToConsider.reduce(
    (sum, game) => sum + parseFloat(game.FGA),
    0
  );
  if (!totalFGA) {
    return 0;
  }
  return parseFloat(((totalFTA / totalFGA) * 100).toFixed(2));
};

export const calculateUsgAverage = (
  games,
  teamData,
  team,
  date,
  currentIndex,
  numGames
) => {
  const teamGames = teamData.filter((game) => game.TEAM === team);
  const start = Math.max(0, currentIndex - numGames); // Start index to get the last 5 games (or fewer if early in season)
  const playerGamesToConsider = games.slice(start, currentIndex); // Slice the last 5
  let totalPlayerFGA = 0;
  let totalPlayerFTA = 0;
  let totalPlayerTOs = 0;
  let totalPlayerMins = 0;
  let totalTeamMins = 0;
  let totalTeamFGA = 0;
  let totalTeamFTA = 0;
  let totalTeamTOs = 0;
  playerGamesToConsider.forEach((game) => {
    const playedGameDate = new Date(game.MATCHUP.split(" - ")[0]);
    const teamIndex = teamGames.findIndex((teamGame) => {
      const gameDate = new Date(teamGame.DATE);
      if (gameDate.toDateString() === playedGameDate.toDateString()) {
        return true;
      }
      return false;
    });
    const teamGameLog = teamGames[teamIndex];
    totalPlayerFGA += parseFloat(game["FGA"]);
    totalPlayerFTA += parseFloat(game["FTA"]);
    totalPlayerTOs += parseFloat(game["TOV"]);
    totalPlayerMins += parseFloat(game["MIN"]);
    totalPlayerFTA += parseFloat(game["FTA"]);
    totalTeamFGA += parseFloat(teamGameLog["FGA"]);
    totalTeamMins += parseFloat(teamGameLog["MIN"]);

    totalTeamFTA += parseFloat(teamGameLog["FTA"]);
    totalTeamTOs += parseFloat(teamGameLog["TOV"]);
  });

  if (!totalPlayerMins) {
    return 0;
  }

  return parseFloat(
    (
      ((totalPlayerFGA + 0.44 * totalPlayerFTA + totalPlayerTOs) *
        totalTeamMins *
        100) /
      (totalPlayerMins * (totalTeamFGA + 0.44 * totalTeamFTA + totalTeamTOs))
    ).toFixed(2)
  );
};

export const calculateTSAverage = (games, currentIndex, numGames) => {
  const start = Math.max(0, currentIndex - numGames); // Start index to get the last 5 games (or fewer if early in season)
  const playerGamesToConsider = games.slice(start, currentIndex); // Slice the last 5
  let totalPlayerFGA = 0;
  let totalPlayerFTA = 0;
  let totalPlayerFGM = 0;
  let totalPlayerPTS = 0;
  playerGamesToConsider.forEach((game) => {
    totalPlayerFGA += parseFloat(game["FGA"]);
    totalPlayerFTA += parseFloat(game["FTA"]);
    totalPlayerFGM += parseFloat(game["FGM"]);
    totalPlayerPTS += parseFloat(game["PTS"]);
  });

  if (!totalPlayerFGA) {
    return 0;
  }

  return parseFloat(
    (
      (totalPlayerPTS * 100) /
      (2 * (totalPlayerFGA + 0.44 * totalPlayerFTA))
    ).toFixed(2)
  );
};

export const calculateEFGAverage = (games, currentIndex, numGames) => {
  const start = Math.max(0, currentIndex - numGames); // Start index to get the last 5 games (or fewer if early in season)
  const playerGamesToConsider = games.slice(start, currentIndex); // Slice the last 5
  let totalPlayerFGA = 0;
  let totalPlayerFGM = 0;
  let totalPlayer3PM = 0;
  playerGamesToConsider.forEach((game) => {
    totalPlayerFGA += parseFloat(game["FGA"]);
    totalPlayerFGM += parseFloat(game["FGM"]);
    totalPlayer3PM += parseFloat(game["3PM"]);
  });

  if (!totalPlayerFGA) {
    return 0;
  }

  return parseFloat(
    (((totalPlayerFGM + 0.5 * totalPlayer3PM) * 100) / totalPlayerFGA).toFixed(
      2
    )
  );
};

export const calcPointsOffTurnoversPercentage = (
  games,
  currentIndex,
  gamesBack
) => {
  // Calculate the start index, considering gamesBack and early season edge cases
  const start = Math.max(0, currentIndex - gamesBack);

  // Slice the last 5 games (or fewer if it's early in the season)
  const gamesToConsider = games.slice(start, currentIndex);

  // Sum total points and total points off turnovers (POT) for these games
  const { totalPoints, totalPOT } = gamesToConsider.reduce(
    (totals, game) => {
      const points = parseFloat(game.PTS) || 0; // Player's total points in the game
      const pot = parseFloat(game.PTSOFFTO) || 0; // Player's points off turnovers in the game

      return {
        totalPoints: totals.totalPoints + points,
        totalPOT: totals.totalPOT + pot,
      };
    },
    { totalPoints: 0, totalPOT: 0 }
  );

  // Calculate the percentage of points off turnovers over the last 5 games
  const percentage = totalPoints > 0 ? (totalPOT / totalPoints) * 100 : 0;

  return parseFloat(percentage.toFixed(2)); // Return percentage rounded to 2 decimal places
};

export const calcPITPPercentage = (games, currentIndex, gamesBack) => {
  const start = Math.max(0, currentIndex - gamesBack);

  const gamesToConsider = games.slice(start, currentIndex);

  const { totalPoints, totalPITP } = gamesToConsider.reduce(
    (totals, game) => {
      const points = parseFloat(game.PTS) || 0;
      const pitp = parseFloat(game.PITP) || 0;

      return {
        totalPoints: totals.totalPoints + points,
        totalPITP: totals.totalPITP + pitp,
      };
    },
    { totalPoints: 0, totalPITP: 0 }
  );

  const percentage = totalPoints > 0 ? (totalPITP / totalPoints) * 100 : 0;

  return parseFloat(percentage.toFixed(2));
};

export const calculateTeamPace = (teamData, team, date, gamesBack) => {
  const teamGames = teamData.filter((game) => game.TEAM === team);
  const currentIndex = teamGames.findIndex((game) => {
    const gameDate = new Date(game.DATE);
    if (gameDate.toDateString() === date) {
      return true;
    }
    return false;
  });

  const start = Math.max(0, currentIndex - (gamesBack || currentIndex));
  const gamesToConsider = teamGames.slice(start, currentIndex);
  const totalPace = gamesToConsider.reduce(
    (sum, game) => sum + parseFloat(game.PACE),
    0
  );
  if (gamesToConsider.length === 0) {
    return 0;
  }
  const averagePace = totalPace / gamesToConsider.length;
  return parseFloat(averagePace.toFixed(2));
};

export const teamOReboundRateAvg = (teamData, team, date, gamesBack) => {
  const teamGames = teamData.filter((game) => game.TEAM === team);
  const currentIndex = teamGames.findIndex((game) => {
    const gameDate = new Date(game.DATE);
    if (gameDate.toDateString() === date) {
      return true;
    }
    return false;
  });

  const start = Math.max(0, currentIndex - (gamesBack || currentIndex));
  const gamesToConsider = teamGames.slice(start, currentIndex);

  let weightedSum = 0; // Sum of weighted offensive rebound percentages
  let totalAvailableRebounds = 0; // Total available rebounds
  gamesToConsider.forEach((game) => {
    const offensiveReboundPercentage = parseFloat(game["OREB%"]);
    const totalMissedShots = parseFloat(game.FGA - game.FGM);
    const availableOffensiveRebounds = totalMissedShots; // Assuming all missed shots are available for offensive rebounds

    // Update the weighted sum and total available rebounds
    weightedSum += offensiveReboundPercentage * availableOffensiveRebounds;
    totalAvailableRebounds += availableOffensiveRebounds;
  });

  // Calculate weighted average
  const weightedAverage =
    totalAvailableRebounds > 0 ? weightedSum / totalAvailableRebounds : 0; // Avoid division by zero

  return parseFloat(weightedAverage.toFixed(2)); // Return the average rounded to two decimal places
};

export const oppTeamDReboundRateAvg = (teamData, oppTeam, date, gamesBack) => {
  const oppTeamGames = teamData.filter((game) => game.TEAM === oppTeam);
  const oppCurrentIndex = oppTeamGames.findIndex((game) => {
    const gameDate = new Date(game.DATE);
    if (gameDate.toDateString() === date) {
      return true;
    }
    return false;
  });

  if (oppCurrentIndex <= 0) {
    return 0;
  }

  const start = Math.max(0, oppCurrentIndex - (gamesBack || oppCurrentIndex));
  const gamesToConsider = oppTeamGames.slice(start, oppCurrentIndex);

  let weightedSum = 0; // Sum of weighted offensive rebound percentages
  let totalAvailableRebounds = 0; // Total available rebounds
  gamesToConsider.forEach((game) => {
    const oppTeamName = game.MATCHUP.split(" ")[2];
    const oppGameLog = teamData.filter(
      (oppGame) => oppGame.TEAM === oppTeamName && oppGame.DATE === game.DATE
    );
    const DReboundPercentage = parseFloat(game["DREB%"]);
    const totalMissedShots = parseFloat(oppGameLog[0].FGA - oppGameLog[0].FGM);
    const availableDRebounds = totalMissedShots; // Assuming all missed shots are available for offensive rebounds

    // Update the weighted sum and total available rebounds
    weightedSum += DReboundPercentage * availableDRebounds;
    totalAvailableRebounds += availableDRebounds;
  });

  // Calculate weighted average
  const weightedAverage =
    totalAvailableRebounds > 0 ? weightedSum / totalAvailableRebounds : 0; // Avoid division by zero

  return parseFloat(weightedAverage.toFixed(2)); // Return the average rounded to two decimal places
};

export const oppTeamTORateAvg = (teamData, oppTeam, date, gamesBack) => {
  const oppTeamGames = teamData.filter((game) => game.TEAM === oppTeam);
  const oppCurrentIndex = oppTeamGames.findIndex((game) => {
    const gameDate = new Date(game.DATE);
    if (gameDate.toDateString() === date) {
      return true;
    }
    return false;
  });

  if (oppCurrentIndex <= 0) {
    return 0;
  }

  const start = Math.max(0, oppCurrentIndex - (gamesBack || oppCurrentIndex));
  const gamesToConsider = oppTeamGames.slice(start, oppCurrentIndex);
  let totalTO = 0;
  let totalFGA = 0;
  let totalFTA = 0;
  gamesToConsider.forEach((game) => {
    totalTO += parseFloat(game["TOV"]);
    totalFGA += parseFloat(game["FGA"]);
    totalFTA += parseFloat(game["FTA"]);
  });
  const possessions = totalFGA + 0.44 * totalFTA + totalTO;

  if (!possessions) {
    return 0;
  }

  // Calculate weighted average
  const TORate = (totalTO * 100) / possessions;

  return parseFloat(TORate.toFixed(2)); // Return the average rounded to two decimal places
};

export const oppTeamFTRateAgainstAvg = (teamData, oppTeam, date, gamesBack) => {
  const oppTeamGames = teamData.filter((game) => game.TEAM === oppTeam);
  const oppCurrentIndex = oppTeamGames.findIndex((game) => {
    const gameDate = new Date(game.DATE);
    if (gameDate.toDateString() === date) {
      return true;
    }
    return false;
  });

  if (oppCurrentIndex <= 0) {
    return 0;
  }

  const start = Math.max(0, oppCurrentIndex - (gamesBack || oppCurrentIndex));
  const gamesToConsider = oppTeamGames.slice(start, oppCurrentIndex);

  // For each opposing team the player is playing, it gets the ft rate allowed by that opposing team

  let ftaSum = 0;
  let fgaSum = 0;
  gamesToConsider.forEach((game) => {
    const oppTeamName = game.MATCHUP.split(" ")[2];
    const oppGameLog = teamData.filter(
      (oppGame) => oppGame.TEAM === oppTeamName && oppGame.DATE === game.DATE
    );
    const fga = parseFloat(oppGameLog[0].FGA);
    const fta = parseFloat(oppGameLog[0].FTA);
    ftaSum += fta;
    fgaSum += fga;
  });

  if (!fgaSum) {
    return 0;
  }

  const ftRate = (ftaSum / fgaSum) * 100;

  return parseFloat(ftRate.toFixed(2)); // Return the average rounded to two decimal places
};

export const oppTeamPercentThreesTakenAgainstAvg = (
  teamData,
  oppTeam,
  date,
  gamesBack
) => {
  const oppTeamGames = teamData.filter((game) => game.TEAM === oppTeam);
  const oppCurrentIndex = oppTeamGames.findIndex((game) => {
    const gameDate = new Date(game.DATE);
    if (gameDate.toDateString() === date) {
      return true;
    }
    return false;
  });

  if (oppCurrentIndex <= 0) {
    return 0;
  }

  const start = Math.max(0, oppCurrentIndex - (gamesBack || oppCurrentIndex));
  const gamesToConsider = oppTeamGames.slice(start, oppCurrentIndex);

  let total3pa = 0;
  let totalFga = 0;
  gamesToConsider.forEach((game) => {
    const oppTeamName = game.MATCHUP.split(" ")[2];
    const oppGameLog = teamData.filter(
      (oppGame) => oppGame.TEAM === oppTeamName && oppGame.DATE === game.DATE
    );
    total3pa += parseFloat(oppGameLog[0]["3PA"]);
    totalFga += parseFloat(oppGameLog[0]["FGA"]);
  });

  if (!totalFga) {
    return 0;
  }

  const percentOfFga = (total3pa / totalFga) * 100;

  return parseFloat(percentOfFga.toFixed(2)); // Return the average rounded to two decimal places
};

export const oppTeam3paAgainstRelativeAvg = (
  teamData,
  oppTeam,
  date,
  gamesBack
) => {
  const oppTeamGames = teamData.filter((game) => game.TEAM === oppTeam);
  const oppCurrentIndex = oppTeamGames.findIndex((game) => {
    const gameDate = new Date(game.DATE);
    if (gameDate.toDateString() === date) {
      return true;
    }
    return false;
  });

  if (oppCurrentIndex <= 0) {
    return 0;
  }

  const start = Math.max(0, oppCurrentIndex - (gamesBack || oppCurrentIndex));
  const gamesToConsider = oppTeamGames.slice(start, oppCurrentIndex);

  let dataArr = [];
  let dataArr2 = [];
  gamesToConsider.forEach((game) => {
    const matchupDate = new Date(game.DATE);
    const matchupDateString = matchupDate.toDateString();
    const oppTeamName = game.MATCHUP.split(" ")[2];
    const oppTeamLogs = teamData.filter((game) => game.TEAM === oppTeamName);
    const oppTeamLogIndex = oppTeamLogs.findIndex((game) => {
      const gameDate = new Date(game.DATE);
      if (gameDate.toDateString() === matchupDateString) {
        return true;
      }
      return false;
    });
    if (oppTeamLogIndex <= 0) {
      return 0;
    }
    const oppStart = Math.max(
      0,
      oppTeamLogIndex - (gamesBack || oppTeamLogIndex)
    );
    const oppGamesToConsider = oppTeamLogs.slice(oppStart, oppTeamLogIndex);
    let oppTeam3pa = 0;
    oppGamesToConsider.forEach((oppGame) => {
      oppTeam3pa += parseFloat(oppGame["3PA"]);
    });
    const average3paOppTeam = oppTeam3pa / oppGamesToConsider.length;
    dataArr.push(parseFloat(oppTeamLogs[oppTeamLogIndex]["3PA"]));
    dataArr2.push(parseFloat(average3paOppTeam));
    oppTeam3pa = 0;
  });

  const sumAverage = dataArr2.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );
  const sumTotalCurrentGame = dataArr.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );

  if (!sumAverage) {
    return 0;
  }

  return parseFloat(
    (((sumTotalCurrentGame - sumAverage) / sumAverage) * 100).toFixed(2)
  );
};

export const oppTeam3pPercentAgainstRelativeAvg = (
  teamData,
  oppTeam,
  date,
  gamesBack
) => {
  const oppTeamGames = teamData.filter((game) => game.TEAM === oppTeam);
  const oppCurrentIndex = oppTeamGames.findIndex((game) => {
    const gameDate = new Date(game.DATE);
    if (gameDate.toDateString() === date) {
      return true;
    }
    return false;
  });

  if (oppCurrentIndex <= 0) {
    return 0;
  }

  const start = Math.max(0, oppCurrentIndex - (gamesBack || oppCurrentIndex));
  const gamesToConsider = oppTeamGames.slice(start, oppCurrentIndex);

  let dataArr = [];
  let dataArr2 = [];
  gamesToConsider.forEach((game) => {
    const matchupDate = new Date(game.DATE);
    const matchupDateString = matchupDate.toDateString();
    const oppTeamName = game.MATCHUP.split(" ")[2];
    const oppTeamLogs = teamData.filter((game) => game.TEAM === oppTeamName);
    const oppTeamLogIndex = oppTeamLogs.findIndex((game) => {
      const gameDate = new Date(game.DATE);
      if (gameDate.toDateString() === matchupDateString) {
        return true;
      }
      return false;
    });
    if (oppTeamLogIndex <= 0) {
      return 0;
    }
    const oppStart = Math.max(
      0,
      oppTeamLogIndex - (gamesBack || oppTeamLogIndex)
    );
    const oppGamesToConsider = oppTeamLogs.slice(oppStart, oppTeamLogIndex);
    let oppTeam3pa = 0;
    let oppTeam3pm = 0;
    oppGamesToConsider.forEach((oppGame) => {
      oppTeam3pa += parseFloat(oppGame["3PA"]);
      oppTeam3pm += parseFloat(oppGame["3PM"]);
    });
    if (!oppTeam3pa) {
      return 0;
    }
    const average3pPercentOppTeam = parseFloat((oppTeam3pm / oppTeam3pa) * 100);
    dataArr.push(parseFloat(oppTeamLogs[oppTeamLogIndex]["3P%"]));
    dataArr2.push(parseFloat(average3pPercentOppTeam));
    oppTeam3pa = 0;
    oppTeam3pm = 0;
  });

  const sumPercentAverage = dataArr2.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );
  const sumPercentCurrentGame = dataArr.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );
  if (!sumPercentAverage) {
    return 0;
  }

  return parseFloat(
    (
      ((sumPercentCurrentGame - sumPercentAverage) / sumPercentAverage) *
      100
    ).toFixed(2)
  );
};

export const oppTeamFgPercentAgainstRelativeAvg = (
  teamData,
  oppTeam,
  date,
  gamesBack
) => {
  const oppTeamGames = teamData.filter((game) => game.TEAM === oppTeam);
  const oppCurrentIndex = oppTeamGames.findIndex((game) => {
    const gameDate = new Date(game.DATE);
    if (gameDate.toDateString() === date) {
      return true;
    }
    return false;
  });

  if (oppCurrentIndex <= 0) {
    return 0;
  }

  const start = Math.max(0, oppCurrentIndex - (gamesBack || oppCurrentIndex));
  const gamesToConsider = oppTeamGames.slice(start, oppCurrentIndex);

  let dataArr = [];
  let dataArr2 = [];
  gamesToConsider.forEach((game) => {
    const matchupDate = new Date(game.DATE);
    const matchupDateString = matchupDate.toDateString();
    const oppTeamName = game.MATCHUP.split(" ")[2];
    const oppTeamLogs = teamData.filter((game) => game.TEAM === oppTeamName);
    const oppTeamLogIndex = oppTeamLogs.findIndex((game) => {
      const gameDate = new Date(game.DATE);
      if (gameDate.toDateString() === matchupDateString) {
        return true;
      }
      return false;
    });
    if (oppTeamLogIndex <= 0) {
      return 0;
    }
    const oppStart = Math.max(
      0,
      oppTeamLogIndex - (gamesBack || oppTeamLogIndex)
    );
    const oppGamesToConsider = oppTeamLogs.slice(oppStart, oppTeamLogIndex);
    let oppTeamFga = 0;
    let oppTeamFgm = 0;
    oppGamesToConsider.forEach((oppGame) => {
      oppTeamFga += parseFloat(oppGame["FGA"]);
      oppTeamFgm += parseFloat(oppGame["FGM"]);
    });
    if (!oppTeamFga) {
      return 0;
    }
    const averageFgPercentOppTeam = parseFloat((oppTeamFgm / oppTeamFga) * 100);
    dataArr.push(parseFloat(oppTeamLogs[oppTeamLogIndex]["FG%"]));
    dataArr2.push(parseFloat(averageFgPercentOppTeam));
    oppTeamFga = 0;
    oppTeamFgm = 0;
  });

  const sumPercentAverage = dataArr2.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );
  const sumPercentCurrentGame = dataArr.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );
  if (!sumPercentAverage) {
    return 0;
  }

  return parseFloat(
    (
      ((sumPercentCurrentGame - sumPercentAverage) / sumPercentAverage) *
      100
    ).toFixed(2)
  );
};

export const oppTeamDFGAvg = (teamData, oppTeam, date, gamesBack) => {
  const oppTeamGames = teamData.filter((game) => game.TEAM === oppTeam);
  const oppCurrentIndex = oppTeamGames.findIndex((game) => {
    const gameDate = new Date(game.DATE);
    if (gameDate.toDateString() === date) {
      return true;
    }
    return false;
  });

  if (oppCurrentIndex <= 0) {
    return 0;
  }

  const start = Math.max(0, oppCurrentIndex - (gamesBack || oppCurrentIndex));
  const gamesToConsider = oppTeamGames.slice(start, oppCurrentIndex);

  let oppFGASum = 0;
  let oppFGMSum = 0;
  gamesToConsider.forEach((game) => {
    const oppTeamName = game.MATCHUP.split(" ")[2];
    const oppGameLog = teamData.filter(
      (oppGame) => oppGame.TEAM === oppTeamName && oppGame.DATE === game.DATE
    );
    const fga = parseFloat(oppGameLog[0].FGA);
    const fgm = parseFloat(oppGameLog[0].FGM);
    oppFGMSum += fgm;
    oppFGASum += fga;
  });
  if (!oppFGASum) {
    return 0;
  }

  const dfg = (oppFGMSum / oppFGASum) * 100;

  return parseFloat(dfg.toFixed(2)); // Return the average rounded to two decimal places
};
export const oppTeamPtsAllowedAvg = (teamData, oppTeam, date, gamesBack) => {
  const oppTeamGames = teamData.filter((game) => game.TEAM === oppTeam);
  const oppCurrentIndex = oppTeamGames.findIndex((game) => {
    const gameDate = new Date(game.DATE);
    if (gameDate.toDateString() === date) {
      return true;
    }
    return false;
  });

  if (oppCurrentIndex <= 0) {
    return 0;
  }

  const start = Math.max(0, oppCurrentIndex - (gamesBack || oppCurrentIndex));
  const gamesToConsider = oppTeamGames.slice(start, oppCurrentIndex);

  // For each opposing team the player is playing, it gets the ft rate allowed by that opposing team

  let oppPtsAllowed = 0;
  gamesToConsider.forEach((game) => {
    const oppTeamName = game.MATCHUP.split(" ")[2];
    const oppGameLog = teamData.filter(
      (oppGame) => oppGame.TEAM === oppTeamName && oppGame.DATE === game.DATE
    );
    const pts = parseFloat(oppGameLog[0].PTS);
    oppPtsAllowed += pts;
  });

  const ptsAllowedAverage = oppPtsAllowed / gamesToConsider.length;

  return parseFloat(ptsAllowedAverage.toFixed(2)); // Return the average rounded to two decimal places
};
export const oppTeamPITPAllowedAvg = (teamData, oppTeam, date, gamesBack) => {
  const oppTeamGames = teamData.filter((game) => game.TEAM === oppTeam);
  const oppCurrentIndex = oppTeamGames.findIndex((game) => {
    const gameDate = new Date(game.DATE);
    if (gameDate.toDateString() === date) {
      return true;
    }
    return false;
  });

  if (oppCurrentIndex <= 0) {
    return 0;
  }

  const start = Math.max(0, oppCurrentIndex - (gamesBack || oppCurrentIndex));
  const gamesToConsider = oppTeamGames.slice(start, oppCurrentIndex);

  // For each opposing team the player is playing, it gets the ft rate allowed by that opposing team

  let oppPitpAllowed = 0;
  gamesToConsider.forEach((game) => {
    const pts = parseFloat(game["OPPPITP"]);
    oppPitpAllowed += pts;
  });

  const pitpAllowedAverage = oppPitpAllowed / gamesToConsider.length;

  return parseFloat(pitpAllowedAverage.toFixed(2));
};
export const oppTeamFbPointsAllowedAvg = (
  teamData,
  oppTeam,
  date,
  gamesBack
) => {
  const oppTeamGames = teamData.filter((game) => game.TEAM === oppTeam);
  const oppCurrentIndex = oppTeamGames.findIndex((game) => {
    const gameDate = new Date(game.DATE);
    if (gameDate.toDateString() === date) {
      return true;
    }
    return false;
  });

  if (oppCurrentIndex <= 0) {
    return 0;
  }

  const start = Math.max(0, oppCurrentIndex - (gamesBack || oppCurrentIndex));
  const gamesToConsider = oppTeamGames.slice(start, oppCurrentIndex);

  let oppFBPtsAllowedSum = 0;
  gamesToConsider.forEach((game) => {
    oppFBPtsAllowedSum += parseFloat(game.OPPFBPS);
  });

  const fbPtsAllowed = oppFBPtsAllowedSum / gamesToConsider.length;

  return parseFloat(fbPtsAllowed.toFixed(2));
};

export const calculateTeamOrtg = (teamData, team, date, gamesBack) => {
  const teamGames = teamData.filter((game) => game.TEAM === team);
  const currentIndex = teamGames.findIndex((game) => {
    const gameDate = new Date(game.DATE);
    if (gameDate.toDateString() === date) {
      return true;
    }
    return false;
  });

  if (currentIndex <= 0) {
    return 0;
  }

  const start = Math.max(0, currentIndex - (gamesBack || currentIndex));
  const gamesToConsider = teamGames.slice(start, currentIndex);

  let totalWeightedORtg = 0;
  let totalEstimatedPossessions = 0;
  gamesToConsider.forEach((game) => {
    const ortg = parseFloat(game.OFFRTG); // Offensive Rating of the game
    const fga = parseInt(game.FGA, 10); // Field Goal Attempts
    const fta = parseInt(game.FTA, 10); // Free Throw Attempts
    const turnovers = parseInt(game.TOV, 10); // Turnovers
    const oreb = parseInt(game.OREB, 10); // Offensive Rebounds

    // Estimate possessions
    const estimatedPossessions = fga + 0.44 * fta - oreb + turnovers;

    totalWeightedORtg += ortg * estimatedPossessions;
    totalEstimatedPossessions += estimatedPossessions;
  });
  if (!totalEstimatedPossessions) {
    return 0;
  }

  const weightedORtg = totalWeightedORtg / totalEstimatedPossessions;

  // Return the result rounded to two decimal places
  return parseFloat(weightedORtg.toFixed(2));
};

export const oppTeamDrtgAgainstRelativeAvg = (
  teamData,
  oppTeam,
  date,
  gamesBack
) => {
  const oppTeamGames = teamData.filter((game) => game.TEAM === oppTeam);
  const oppCurrentIndex = oppTeamGames.findIndex((game) => {
    const gameDate = new Date(game.DATE);
    if (gameDate.toDateString() === date) {
      return true;
    }
    return false;
  });

  if (oppCurrentIndex <= 0) {
    return 0;
  }

  const start = Math.max(0, oppCurrentIndex - (gamesBack || oppCurrentIndex));
  const gamesToConsider = oppTeamGames.slice(start, oppCurrentIndex);

  let dataArr = [];
  let dataArr2 = [];
  gamesToConsider.forEach((game) => {
    const matchupDate = new Date(game.DATE);
    const matchupDateString = matchupDate.toDateString();
    const oppTeamName = game.MATCHUP.split(" ")[2];
    const oppTeamLogs = teamData.filter((game) => game.TEAM === oppTeamName);
    const oppTeamLogIndex = oppTeamLogs.findIndex((game) => {
      const gameDate = new Date(game.DATE);
      if (gameDate.toDateString() === matchupDateString) {
        return true;
      }
      return false;
    });
    if (oppTeamLogIndex <= 0) {
      return 0;
    }
    const oppStart = Math.max(
      0,
      oppTeamLogIndex - (gamesBack || oppTeamLogIndex)
    );
    const oppGamesToConsider = oppTeamLogs.slice(oppStart, oppTeamLogIndex);
    let oppTeamFga = 0;
    let oppTeamFta = 0;
    let oppTeamTos = 0;
    let oppTeamOreb = 0;
    let oppTeamOrtg = 0;
    let oppTeamWeightedOrtg = 0;
    oppGamesToConsider.forEach((oppGame) => {
      oppTeamFga += parseFloat(oppGame["FGA"]);
      oppTeamFta += parseFloat(oppGame["FTA"]);
      oppTeamTos += parseFloat(oppGame["TOV"]);
      oppTeamOreb += parseFloat(oppGame["OREB"]);
      oppTeamOrtg += parseFloat(oppGame["OFFRTG"]);
      oppTeamWeightedOrtg +=
        parseFloat(oppGame["OFFRTG"]) *
        (parseFloat(oppGame["FGA"]) +
          0.44 * parseFloat(oppGame["FTA"]) -
          parseFloat(oppGame["OREB"]) +
          parseFloat(oppGame["TOV"]));
    });
    const totalEstimatedPossessions =
      oppTeamFga + 0.44 * oppTeamFta - oppTeamOreb + oppTeamTos;
    const averageOrtgOppTeam = parseFloat(
      oppTeamWeightedOrtg / totalEstimatedPossessions
    );
    dataArr.push(parseFloat(oppTeamLogs[oppTeamLogIndex]["OFFRTG"]));
    dataArr2.push(parseFloat(averageOrtgOppTeam));
    oppTeamFga = 0;
    oppTeamFta = 0;
    oppTeamTos = 0;
    oppTeamOreb = 0;
    oppTeamOrtg = 0;
    oppTeamWeightedOrtg = 0;
  });

  const sumOrtgAverage = dataArr2.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );
  const sumOrtgCurrentGame = dataArr.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );

  if (!sumOrtgAverage) {
    return 0;
  }

  return parseFloat(
    (((sumOrtgCurrentGame - sumOrtgAverage) / sumOrtgAverage) * 100).toFixed(2)
  );
};

export const calculateTeamPossessions = (teamData, team, date, gamesBack) => {
  const teamGames = teamData.filter((game) => game.TEAM === team);
  const currentIndex = teamGames.findIndex((game) => {
    const gameDate = new Date(game.DATE);
    if (gameDate.toDateString() === date) {
      return true;
    }
    return false;
  });

  if (currentIndex <= 0) {
    return 0;
  }

  const start = Math.max(0, currentIndex - (gamesBack || currentIndex));
  const gamesToConsider = teamGames.slice(start, currentIndex);

  let totalEstimatedPossessions = 0;
  gamesToConsider.forEach((game) => {
    const fga = parseInt(game.FGA, 10); // Field Goal Attempts
    const fta = parseInt(game.FTA, 10); // Free Throw Attempts
    const turnovers = parseInt(game.TOV, 10); // Turnovers
    const oreb = parseInt(game.OREB, 10); // Offensive Rebounds

    // Estimate possessions
    const estimatedPossessions = fga + 0.44 * fta - oreb + turnovers;

    totalEstimatedPossessions += estimatedPossessions;
  });

  const possessionsAvg = totalEstimatedPossessions / gamesToConsider.length;

  // Return the result rounded to two decimal places
  return parseFloat(possessionsAvg.toFixed(2));
};
