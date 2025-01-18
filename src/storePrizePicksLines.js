import pkg from "pg";
import dotenv from "dotenv";

export const storePlayerLines = async (playerLines) => {
  const { Client } = pkg;
  dotenv.config();
  const client = new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: "sport_bet_model", // Connect to your newly created database
  });

  const getCurrentDate = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // Get month (1-12) and pad to 2 digits
    const day = String(today.getDate()).padStart(2, "0"); // Get day (1-31) and pad to 2 digits
    const year = today.getFullYear(); // Get year (4 digits)

    return `${month}/${day}/${year}`; // Format as MM/DD/YYYY
  };
  try {
    await client.connect(); // Ensure the client is connected
    console.log("Connected to database");
    const currentDate = getCurrentDate();
    for (const playerLine of playerLines) {
      const { name, points, team, opponent } = playerLine;
      const opposingTeam = opponent.split(" ")[1];
      const prizepicksLine = parseFloat(points?.replace(/[^\d.-]/g, ""));

      // Use parameterized queries to prevent SQL injection
      const query = `
          INSERT INTO prizepick_point_lines (player_name, team_name, opponent_name, prizepicks_point_line, game_date)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (game_date, player_name) 
          DO UPDATE SET 
          team_name = EXCLUDED.team_name,
          opponent_name = EXCLUDED.opponent_name,
          prizepicks_point_line = EXCLUDED.prizepicks_point_line
        `;

      const values = [name, team, opposingTeam, prizepicksLine, currentDate];

      // Execute the query
      await client.query(query, values);
    }

    console.log("Player predictions inserted successfully");
  } catch (err) {
    console.error("Error inserting player predictions:", err);
  } finally {
    // Close the connection
    await client.end();
  }
};
