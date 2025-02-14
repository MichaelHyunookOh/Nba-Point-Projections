import pkg from "pg";
import dotenv from "dotenv";

const { Client } = pkg;
dotenv.config();

const createTable = async () => {
  const client = new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: "sport_bet_model", // Connect to your newly created database
  });
  const query = `
    CREATE TABLE player_lines (
      id SERIAL PRIMARY KEY,
      player_name VARCHAR(100),
      team_name VARCHAR(50),
      opponent_name VARCHAR(50),
      prizepicks_point_line DECIMAL,
      model1_prediction DECIMAL,
      model2_prediction DECIMAL,
      game_date DATE
    );
  `;
  try {
    await client.connect();
    await client.query(query);
    console.log('Table "player_lines" created successfully!');

    // You can now run your queries, such as creating tables, inserting data, etc.
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await client.end();
  }
};

createTable();
