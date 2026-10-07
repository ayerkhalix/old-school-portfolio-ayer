export type MusicTrack = { id: string; title: string; artist?: string; file: string };
export const startupMusicTrack = "City Pop X R&B Type Beat Illusion.mp3";

// Optional metadata overrides, keyed by the exact filename. New audio files
// are discovered automatically; this map is only for editorial improvements.
export const musicMetadata: Record<string, { title?: string; artist?: string }> = {
  "City Pop x R&B Type Beat Ice Cream Song Instrumental to use 😻.mp3": { title: "Ice Cream" },
  "City Pop X R&B Type Beat Illusion.mp3": { title: "Illusion" },
  "[No copyright music] Dance with me (Free) -City Pop & Funk Type Beat-.mp3": { title: "Dance with Me" },
  "[FREE FOR PROFIT] Retro City Pop Type-Beat (Beats by genewav).mp3": { title: "Retro City Pop", artist: "genewav" },
};
