# Ayer Khali Abrio — On Air

A complete retro CRT portfolio: eight HTML channels, a procedural Three.js television, a physical HTML remote, and a cinematic nighttime workspace with Night Radio.

## Run locally

Requires Node 22.13 or newer.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. For the production version:

```sh
npm run typecheck
npm run build
npm start
```

`out/` is the static production export. It can also be hosted on Vercel or any static web host. The `.openai/hosting.json` manifest identifies the separately hosted, private Sites preview; the original Vercel deployment has not been changed.

## Edit content

All names, project descriptions, stacks, roles, experience, awards, and contact URLs are in `data/portfolio.ts`. Project screenshots are in `public/images/`.

Content was recovered from https://ayerkhali.vercel.app and supplemented only with facts in the owner's supplied brief. Existing screenshots, GitHub repositories, live projects, email, and LinkedIn were preserved. Unverified experience metrics and placeholder `#` project URLs were removed. No dates or private system links were invented.

The existing `https://ayerkhali.vercel.app/resume.pdf` returns 404. The resume option is omitted. To enable it, add a PDF to `public/resume.pdf` and set `profile.resume` to `/resume.pdf`.

Food N Bev N Beyond has a typographic cover because no actual project screenshot or URL was supplied. Add its image and verified links in the project record when available.

## Controls

- Remote channel buttons, CH +/−: switch sections with a short static transition. On Music, CH +/− changes tracks.
- Arrows: left/right browse projects or change channels; up/down scroll screen content.
- OK / Enter / Space: open the selected project. BACK / Escape: close the detail view.
- H, A, P, E, S, W, C: Home, About, Projects, Experience, Skills, Awards, Contact.
- N / MUSIC: CH 08, Night Radio. Up/down selects a track, OK plays it, left/right seeks ten seconds. The deck also has play/pause, stop, previous/next, a seek slider, and touch volume controls.
- F: toggle browser fullscreen or CSS immersive fallback. Escape also exits immersive mode.
- M / MUTE: mute music and brief remote clicks, channel static, and power sweeps. Sound defaults on for every load. Continuous room noise and CRT hum are disabled.
- VOL +/? (or +/? keys): adjust music and brief UI sounds, with a CRT volume overlay. Volume starts at 55% and remembers adjustments. Every page load starts with Illusion and sound on, attempting normal audible autoplay. If browser policy blocks it, the first pointer or keyboard interaction starts the radio; Play also works. Power controls the display while music continues. Fullscreen preserves playback, volume, and mute.
- ?: keyboard reference. Tab retains normal focus navigation.
- Mobile: fixed touch controller with channel selector, project arrows, OK, back, power, fullscreen, and sound. Screen content scrolls normally by touch.

## Architecture and performance

- Next.js 16.3.4, React 19.2.6, TypeScript, Tailwind CSS 4.
- `components/portfolio/Portfolio.tsx`: central state, transitions, history, keyboard input, power, boot, fullscreen.
- `Channels.tsx`: semantic HTML content and project browser.
- `Remote.tsx`: accessible physical buttons, CSS depth and perspective.
- `TelevisionModel.tsx`: lazy procedural Three.js mesh with an orthographic camera, clear-coated aged plastic, subtle microtexture, vents, knobs, and lighting. There is no continuous rendering loop: it renders on initialization, resize, and power changes. CSS glass adds restrained warm reflections and curved edge highlights over the readable HTML display.
- `AmbientRoom.tsx`: a localized lamp-light shader affects the bulb, nearby wall, and desk. It renders only on resize, visibility changes, and four brief brightness steps every randomized 4–7 seconds. Reduced motion and unavailable WebGL retain the original photograph. CSS gradients create low, barely visible haze on a 23-second drift, static on phones and for reduced motion. A separate cyan room glow fades with TV power.
- `useAudio.ts`: short remote/channel/power effects share the music volume/mute control. There are no looping noise sources or hum oscillators. The optional Web Audio graph is created only on interaction, suspends in hidden tabs, and closes on unmount.
- `useMusic.ts` / `MusicChannel.tsx`: one HTML audio element stays mounted across channels, fullscreen, and power changes. The playlist loops, skips failed tracks, and fades new track attacks over 160ms. Startup always selects Illusion, overriding the previous selected track and mute preference; audible volume preferences remain persisted, while a saved zero resets to 55%. Ordinary autoplay failures fall back to a real mouse, touch-release, click, or keyboard gesture. A compact Start radio button appears below the television when playback needs interaction. Playback status follows the actual `playing` event. Explicit pause/stop/mute controls prevent gesture retries, and pressing Play at zero volume restores 55%.
- No Spline scene was supplied. Three.js provides a self-contained 3D television; a lightweight render of that exact cabinet preserves its color and geometry during loading and when WebGL fails. The remote uses HTML and CSS 3D transforms. Mobile uses its own CSS cabinet and simplifies the scene instead of shrinking the desktop remote.
- Responsive WebP assets, local fonts, pixel ratio capped at 1.5, and reduced-motion support.
- All eight channels are present in the server-rendered DOM, with structured project metadata, Open Graph / X metadata, semantic headings, native controls, focus indicators, and a skip link.

## Music library

Drop `.mp3`, `.wav`, `.ogg`, or `.m4a` files directly into `public/bgm`. `lib/music.ts` discovers them in the server page and places the configured `startupMusicTrack` (Illusion) first, followed by alphabetical order; URLs safely encode spaces, brackets, and Unicode. Titles default to cleaned filenames, and missing artists display UNKNOWN ARTIST. `data/music.ts` provides optional filename-keyed title/artist overrides; adding a track does not require an entry. Empty or missing folders leave a working empty deck.

For the static production export, rebuild after adding/removing files (`npm run build`). The local production server supports audio MIME types and byte-range requests for seeking. Playback availability depends on the browser's installed codecs.

## Verification

```sh
npx playwright install webkit
npm test
```

The checked environment has locally installed Chrome and Edge. `playwright.config.ts` covers Desktop Chrome, Desktop Edge, Tablet Chrome, Mobile Chrome, and iPhone-sized WebKit. WebKit emulation is not a test on a physical iPhone.

Browser checks cover all eight channels and contact links, project browsing/detail/back, scroll recovery, power/navigation recovery, sound persistence, deep links and history, keyboard input and help, denied Fullscreen API fallback, preserved fullscreen navigation, reduced motion, focus, horizontal overflow, WebGL failure, failed wallpaper loading, and rapid channel input. Music checks use actual MP3 playback and cover mute/volume, seeking, remote selection, playlist looping, Illusion-first unmuted startup, allowed autoplay and gesture fallback, continuity through fullscreen and display power-off, missing files, failed-track skipping, denied playback, and a browser without Web Audio. Tests run serially because the ambience follows foreground-tab visibility. Ambient checks exercise audio gesture gating, volume/mute, absence of continuous noise, hidden-tab suspension, reduced-motion changes, and a still-image fallback after context loss. The Windows WebKit test build does not expose Web Audio, so its audio fallback is checked; physical iOS audio still needs a device check. Native Fullscreen API was also checked in Chrome. Set `PLAYWRIGHT_BASE_URL` to test a separately served production export.

## Artwork provenance

Built-in imagegen generated three original bitmap assets. Assets were compressed/resized for delivery; project screenshots were recovered from the original portfolio and are not generated mockups.

- `public/images/room.webp`: original cinematic workspace backdrop.
- `public/images/coast.webp`: original Palawan-inspired coastal wallpaper, an artistic scene rather than a documented location photograph.
- `public/og.png`: original social preview card.

Exact final prompts are saved in `docs/artwork-prompts.md`.
