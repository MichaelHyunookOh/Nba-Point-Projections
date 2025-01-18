import features from "../../data/trainingDataStandardizedFeatures-v1.json" assert { type: "json" };
import labels from "../../data/trainingDataLabels-v1.json" assert { type: "json" };
import * as tf from "@tensorflow/tfjs-node";

// {
//   daysSinceLastGame: 1,
//   height: 2,
//   weight: 3,
//   age: 4,
//   home: 5,
//   gamesPlayed: 6,
//   missingOffensiveValue: 7,
//   previousPPG: 8,
//   ppgLast5: 9,
//   ppgSeason: 10,
//   scoringVarianceSeason: 11,
//   scoringRateLast5: 12,
//   scoringRateSeason: 13,
//   mpgLast5: 14,
//   mpgSeason: 15,
//   fgaLast5: 16,
//   fgaSeason: 17,
//   threesAttemptedLast5: 18,
//   threesAttemptedSeason: 19,
//   threesMadePercentageLast5: 20,
//   threesMadePercentageSeason: 21,
//   ftPercentageLast5: 22,
//   ftPercentageSeason: 23,
//   fbPointsPercentageLast5: 24,
//   fbPointsPercentageSeason: 25,
//   ftRateLast5: 26,
//   ftRateSeason: 27,
//   usgLast5: 28,
//   usgSeason: 29,
//   efgLast5: 30,
//   efgSeason: 31,
//   tsLast5: 32,
//   tsSeason: 33,
//   pointsOffTOPercentageLast5: 34,
//   pointsOffTOPercentageSeason: 35,
//   pointsInPaintPercentageLast5: 36,
//   pointsInPaintPercentageSeason: 37,
//   oRebRateLast5: 38,
//   oRebRateSeason: 39,
//   teamGameNumber: 40,
//   teamPaceLast5: 41,
//   teamPaceSeason: 42,
//   teamOrtgLast5: 43,
//   teamOrtgSeason: 44,
//   teamORebRateLast5: 45,
//   teamORebRateSeason: 46,
//   teamPossessionsLast5: 47,
//   teamPossessionsSeason: 48,
//   oppTeamGameNumber: 49,
//   oppTeamPossessionsLast5: 50,
//   oppTeamPossessionsSeason: 51,
//   oppTeamPaceLast5: 52,
//   oppTeamteamPaceSeason: 53,
//   oppTeamPtsAllowedLast5: 54,
//   oppTeamPtsAllowedSeason: 55,
//   oppTeamPitpAllowedLast5: 56,
//   oppTeamPitpAllowedSeason: 57,
//   oppTeamDRebRateLast5: 58,
//   oppTeamDRebRateSeason: 59,
//   oppTeamFBPtsAllowedAvgLast5: 60,
//   oppTeamFBPtsAllowedAvgSeason: 61,
//   oppTeamFTRateAgainstLast5: 62,
//   oppTeamFTRateAgainstSeason: 63,
//   oppTeamDFGLast5: 64,
//   oppTeamDFGSeason: 65,
//   oppTeamTORateLast5: 66,
//   oppTeamTORateSeason: 67,
//   oppTeamThreesAttemptedAgainstPercentLast5: 68,
//   oppTeamThreesAttemptedAgainstPercentSeason: 69,
//   oppTeam3paRelativeAgainstAvgLast5: 70,
//   oppTeam3paRelativeAgainstAvgSeason: 71,
//   oppTeam3pPercentRelativeAgainstAvgLast5: 72,
//   oppTeam3pPercentRelativeAgainstAvgSeason: 73,
//   oppTeamDfgPercentRelativeAgainstAvgLast5: 74,
//   oppTeamDrtgRelativeAgainstAvgSeason: 75,
//   oppTeamDfgPercentRelativeAgainstAvgLast5: 76,
//   oppTeamDrtgRelativeAgainstAvgSeason: 77
// }

// const shuffleData = (features, labels) => {
//   // Step 1: Combine the features and labels into an array of pairs
//   const combined = features.map((feature, index) => ({
//     feature: feature,
//     label: labels[index],
//   }));

//   // Step 2: Shuffle the combined array randomly
//   for (let i = combined.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     // Swap the elements at indices i and j
//     [combined[i], combined[j]] = [combined[j], combined[i]];
//   }

//   // Step 3: Split the shuffled data back into features and labels
//   const shuffledFeatures = combined.map((item) => item.feature);
//   const shuffledLabels = combined.map((item) => item.label);

//   return { shuffledFeatures, shuffledLabels };
// };

// Split data into training and validation sets
// Convert data to tensors
// Assuming features and labels are already defined
const removeIndices = [
  8, 9, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
];
const filteredFeatures = features.map((row) =>
  row.filter((_, colIndex) => removeIndices.includes(colIndex))
);
const featureTensor = tf.tensor2d(filteredFeatures);
const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

const model = tf.sequential();

// Add layers to the model
model.add(
  tf.layers.dense({ inputShape: [16], units: 512, activation: "gelu" })
);
model.add(tf.layers.dense({ units: 256, activation: "gelu" }));
model.add(tf.layers.dense({ units: 128, activation: "gelu" }));
model.add(tf.layers.dense({ units: 64, activation: "gelu" }));
model.add(tf.layers.dense({ units: 1 })); // Single output for regression

// Compile the model
model.compile({
  optimizer: tf.train.adam(0.001), // Learning rate
  loss: "meanSquaredError",
  metrics: ["mae"], // Mean Absolute Error
});

// Train the model
(async () => {
  //   console.log(filteredFeatures.map((row) => console.log(row.length)));
  console.log("Training...");
  const history = await model.fit(featureTensor, labelTensor, {
    epochs: 50, // Number of training iterations
    batchSize: 32, // Mini-batch size for gradient descent
    validationSplit: 0.1,
    callbacks: [
      tf.callbacks.earlyStopping({ monitor: "val_loss", patience: 10 }),
    ],
  });

  console.log("Training Complete");
  console.log("History:", history.history);

  // Save the model for later use
  await model.save("file://./models/points-model-v2"); // Save locally
})();
