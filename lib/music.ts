import { readdir } from "node:fs/promises";
import path from "node:path";
import { musicMetadata, startupMusicTrack, type MusicTrack } from "@/data/music";

// Runs in the server page, including at static-export build time. No filesystem
// code or directory endpoint is shipped to the browser.
export async function discoverMusic(): Promise<MusicTrack[]> {
  try {
    const files = await readdir(path.join(process.cwd(), "public", "bgm"), { withFileTypes: true });
    return files.filter(f => f.isFile() && /\.(mp3|wav|ogg|m4a)$/i.test(f.name))
      .sort((a, b) => Number(b.name === startupMusicTrack) - Number(a.name === startupMusicTrack) || a.name.localeCompare(b.name, "en"))
      .map(({ name }) => {
        const metadata = musicMetadata[name];
        const title = name.replace(/\.[^.]+$/, "").replace(/\[[^\]]*\]\s*/g, "")
          .replace(/[_]/g, " ").replace(/\s+/g, " ").trim();
        return { id: name, title: metadata?.title ?? title, artist: metadata?.artist, file: `/bgm/${encodeURIComponent(name)}` };
      });
  } catch { return []; }
}
