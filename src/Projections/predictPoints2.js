import * as ort from "onnxruntime-node";

import fs from "fs";

// Step 1: Load the ONNX model
const modelPath = "src/models/model2.onnx"; // Path to your ONNX model

export const runModel2 = async (inputData) => {
  const indicesToRemove = [1, 2, 3, 5, 7, 10, 39, 42, 43, 48, 73, 74];

  const filteredInputData = inputData.filter(
    (_, index) => !indicesToRemove.includes(index)
  );

  const reshapedInput = [filteredInputData];
  try {
    // Step 2: Create a session with the ONNX model
    const session = await ort.InferenceSession.create(modelPath);

    // Step 3: Prepare input data
    // Assuming inputData is a 2D array like [[feature1, feature2, ...], ...]
    // Flatten the data correctly and set the shape
    const flattenedInput = new Float32Array(reshapedInput.flat());

    // Ensure the input tensor has the correct shape: [batchSize, numFeatures]
    const inputTensor = new ort.Tensor("float32", flattenedInput, [
      reshapedInput.length,
      65,
    ]);

    // Step 4: Run the model with the input tensor
    const feeds = { input: inputTensor }; // "input" should match the name in the ONNX model
    const results = await session.run(feeds);
    // Step 5: Extract predictions
    const outputTensor = results[Object.keys(results)[0]]; // Get the first output

    return outputTensor.data[0];
  } catch (err) {}
};
// Example Input
// const inputData = [
//   5, 1.88, 91, 24, 1, 16, 0, 26.54, 21.2, 24.31, 9.36, 0.56, 0.66, 37.62, 36.68,
//   19.6, 21.25, 8.6, 9.38, 0.23, 0.29, 0.83, 0.85, 13.25, 6.82, 24.49, 23.82,
//   27.61, 29.31, 43.9, 47.07, 48.81, 51.78, 17.92, 22.11, 50.94, 43.7, 1.08,
//   0.59, 23, 95.9, 97.17, 111.31, 106.79, 30.09, 27.96, 98.15, 100.11, 26,
//   104.06, 103.15, 103.7, 101.12, 118.6, 118, 50.8, 50.63, 73.78, 70.6, 16.8,
//   14.24, 27.21, 27.31, 49.77, 48.6, 14.9, 13.74, 45.12, 41.94, -2.71, -0.41,
//   6.08, 5.75, 4.25, 7.89, -1.05, 4.13,
// ];

// Run predictions
// const test = async () => {
//   const data = await runModel(inputData);
//   console.log(data);
// };
// test();
