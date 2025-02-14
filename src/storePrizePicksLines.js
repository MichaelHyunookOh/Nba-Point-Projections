import pkg from "pg";
import dotenv from "dotenv";

export const storePlayerLines = async (
  playerLines,
  parseOpponentName = false
) => {
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
      const {
        name,
        prizePicksLine,
        team,
        opponent,
        predictedPoints1,
        predictedPoints2,
        uncertainty,
        certaintyPercentage,
        probabilityOver,
        probabilityUnder,
      } = playerLine;

      // Use parameterized queries to prevent SQL injection
      const query = `
          INSERT INTO player_lines (player_name, team_name, opponent_name, prizepicks_point_line, model1_prediction, model2_prediction, uncertainty, certainty_percentage, prob_over, prob_under, game_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (game_date, player_name) 
          DO UPDATE SET 
          team_name = EXCLUDED.team_name,
          opponent_name = EXCLUDED.opponent_name,
          prizepicks_point_line = EXCLUDED.prizepicks_point_line,
          model1_prediction = EXCLUDED.model1_prediction,
          model2_prediction = EXCLUDED.model2_prediction,
          uncertainty = EXCLUDED.uncertainty,
          certainty_percentage = EXCLUDED.certainty_percentage,
          prob_over = EXCLUDED.prob_over,
          prob_under = EXCLUDED.prob_under
        `;

      const values = [
        name,
        team,
        opponent,
        prizePicksLine,
        predictedPoints1,
        predictedPoints2,
        uncertainty,
        certaintyPercentage,
        probabilityOver,
        probabilityUnder,
        currentDate,
      ];

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
