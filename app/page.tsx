import Portfolio from "@/components/portfolio/Portfolio";
import { discoverMusic } from "@/lib/music";
export default async function Page() { return <Portfolio tracks={await discoverMusic()} />; }
