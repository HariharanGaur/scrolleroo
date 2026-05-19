const youtubeShortIds = [
  "gPPxfPThq20", // Dog gum
  "fkCF24OXQxc", // Memes
  "j5a0jTc9S10", // Rick Astley
  "gcUDUjr8rBs", // Surprised Kitty
  "_OBlgSz8sSM"  // Babies
];

const messages = [
  "What the dog doin'?", "Always the low quality videos.", "Never gonna give you up", "Having a purr-fect day!",
  "Baby fever!"];

export const videos = Array.from({ length: 5 }).map((_, index) => ({
  id: index + 1,
  youtubeId: youtubeShortIds[index % youtubeShortIds.length],
  message: messages[index]
}));
