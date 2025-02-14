// this page filters eligible players for a season by mpg and games played and outputs an array of their names

export const getInjuryReport = async () => {
  const url =
    "https://www.rotowire.com/basketball/tables/injury-report.php?team=ALL&pos=ALL";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const injuryData = await response.json();
    return injuryData; // Log or process the injury data
  } catch (error) {
    console.error("Error fetching injury data:", error);
  }
};

// const test = async () => {
//   const data = await getInjuryReport();
//   console.log(JSON.stringify(data));
// };
// getTeams();
// test();
// console.log(teamKeys);
// getAllRosters();
