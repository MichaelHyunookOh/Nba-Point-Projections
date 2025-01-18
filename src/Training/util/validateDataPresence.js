export const validateDataPresence = (dataSets, commonKey) => {
  return dataSets.every((dataSet, index) => {
    if (!dataSet.length) {
      console.warn(`Data missing for dataset index ${index}`);
      return false;
    }
    return dataSet.every((game) => game.hasOwnProperty(commonKey));
  });
};
