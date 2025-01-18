export const normalizeText = (text) => {
  return text
    .normalize("NFD") // Decompose the text into base characters and diacritics
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics using regex
    .toLowerCase(); // Convert to lowercase
};
