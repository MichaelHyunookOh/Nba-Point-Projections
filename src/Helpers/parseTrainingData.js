import trainingData from "../../data/trainingDataCurrentv11.json" assert { type: "json" };
// import trainingDataFeaturesV6 from "../../data/trainingDataFeatures-v6.json" assert { type: "json" };

import fs from "fs";

const saveLabelsToFile = async () => {
  try {
    const filteredForMinutes = trainingData.filter((row) => row[14] >= 15);
    const data = filteredForMinutes.map(
      (innerArray) => innerArray[innerArray.length - 1]
    );

    const filePathLabels = "./data/trainingDataLabelsCurrentv11.json"; // Specify the path for the JSON file

    // Make sure the directory exists, otherwise create it
    const dir = "./data";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Convert data to JSON string
    const jsonData = JSON.stringify(data, null, 2); // Pretty print with 2-space indentation

    // Write the JSON data to the file
    fs.writeFileSync(filePathLabels, jsonData, "utf8");

    console.log("Data successfully saved to trainingDataLabelsCurrentv2.json");
  } catch (error) {
    console.error("Error saving data to file:", error);
  }
};

const saveFeaturesToFile = async () => {
  try {
    const data = trainingData.map((row) => row.slice(0, -1));
    const filteredForMinutes = data.filter((row) => row[14] >= 15);

    const filePathFeatures = "./data/trainingDataFeaturesCurrentv11.json"; // Specify the path for the JSON file

    // Make sure the directory exists, otherwise create it
    const dir = "./data";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Convert data to JSON string
    const jsonData = JSON.stringify(filteredForMinutes, null, 2); // Pretty print with 2-space indentation

    // Write the JSON data to the file
    fs.writeFileSync(filePathFeatures, jsonData, "utf8");

    console.log(
      "Data successfully saved to trainingDataFeaturesCurrentv2.json"
    );
  } catch (error) {
    console.error("Error saving data to file:", error);
  }
};

const standardizeData = (features) => {
  // Calculate means and standard deviations for each feature column
  const means = features[0].map(
    (_, colIndex) =>
      features.reduce((sum, row) => sum + row[colIndex], 0) / features.length
  );

  const stdDevs = features[0].map((_, colIndex) => {
    const mean = means[colIndex];
    const variance =
      features.reduce(
        (sum, row) => sum + Math.pow(row[colIndex] - mean, 2),
        0
      ) / features.length;
    return Math.sqrt(variance);
  });

  // Standardize features
  const standardized = features.map((row) =>
    row.map((value, colIndex) => (value - means[colIndex]) / stdDevs[colIndex])
  );

  return { standardized, means, stdDevs };
};

const saveStandardizedFeaturesToFile = async () => {
  try {
    const { standardized } = standardizeData(trainingDataFeaturesV6);
    const filePathFeaturesStandardized =
      "./data/trainingDataStandardizedFeatures-v6.json"; // Specify the path for the JSON file

    // Make sure the directory exists, otherwise create it
    const dir = "./data";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Convert data to JSON string
    const jsonData = JSON.stringify(standardized, null, 2); // Pretty print with 2-space indentation

    // Write the JSON data to the file
    fs.writeFileSync(filePathFeaturesStandardized, jsonData, "utf8");

    console.log(
      "Data successfully saved to trainingDataStandardizedFeatures-v6.json"
    );
  } catch (error) {
    console.error("Error saving data to file:", error);
  }
};

saveFeaturesToFile();
saveLabelsToFile();
