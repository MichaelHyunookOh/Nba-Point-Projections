export const addLabels = async (labels, gameLogs) => {
  return gameLogs.map((game) =>
    labels.reduce((obj, label, index) => {
      obj[label] = game[index];
      return obj;
    }, {})
  );
};
