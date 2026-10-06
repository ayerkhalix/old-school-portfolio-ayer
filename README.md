# Ayer Khali Abrio — On Air

A complete retro CRT portfolio: seven HTML channels, a procedural Three.js television, a physical HTML remote, and a cinematic nighttime workspace.

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

- Remote channel buttons, CH +/−: switch sections with a short static transition.
- Arrows: left/right browse projects or change channels; up/down scroll screen content.
- OK / Enter / Space: open the selected project. BACK / Escape: close the detail view.
- H, A, P, E, S, W, C: Home, About, Projects, Experience, Skills, Awards, Contact.
- F: toggle browser fullscreen or CSS immersive fallback. Escape also exits immersive mode.
- M / SOUND: enable quiet room air, a CRT hum, mechanical remote clicks, channel static, and power sweeps. Sound starts muted and remembers its preference; reloading never starts audio until you interact.
- VOL +/−: adjust the locally saved sound level.
- ?: keyboard reference. Tab retains normal focus navigation.
- Mobile: fixed touch controller with channel selector, project arrows, OK, back, power, fullscreen, and sound. Screen content scrolls normally by touch.

## Architecture and performance

- Next.js 16.3.4, React 19.2.6, TypeScript, Tailwind CSS 4.
- `components/portfolio/Portfolio.tsx`: central state, transitions, history, keyboard input, power, boot, fullscreen.
- `Channels.tsx`: semantic HTML content and project browser.
- `Remote.tsx`: accessible physical buttons, CSS depth and perspective.
- `TelevisionModel.tsx`: lazy procedural Three.js mesh with an orthographic camera, textured cabinet, vents, knobs, and lighting. There is no continuous rendering loop: it renders on initialization, resize, and power changes.
- `AmbientRoom.tsx`: localized leaf sway and lamp flicker animate the original room artwork, with slow smoke across the desk. The lightweight shader runs at 24 fps (18 on phones), pauses in hidden tabs, and uses the original still image for reduced motion or unavailable WebGL.
- `useAudio.ts`: synthesized room ambience and retro effects share one volume/mute control. The CRT hum follows television power. Audio starts only after a gesture, pauses in hidden tabs, and releases its graph on unmount. No audio assets or autoplay.
- No Spline scene was supplied. Three.js provides a self-contained 3D television; a lightweight render of that exact cabinet preserves its color and geometry during loading and when WebGL fails. The remote uses HTML and CSS 3D transforms. Mobile uses its own CSS cabinet and simplifies the scene instead of shrinking the desktop remote.
- Responsive WebP assets, local fonts, pixel ratio capped at 1.5, and reduced-motion support.
- All seven channels are present in the server-rendered DOM, with structured project metadata, Open Graph / X metadata, semantic headings, native controls, focus indicators, and a skip link.

## Verification

```sh
npx playwright install webkit
npm test
```

The checked environment has locally installed Chrome and Edge. `playwright.config.ts` covers Desktop Chrome, Desktop Edge, Tablet Chrome, Mobile Chrome, and iPhone-sized WebKit. WebKit emulation is not a test on a physical iPhone.

Browser checks cover all channels and contact links, project browsing/detail/back, scroll recovery, power/navigation recovery, sound persistence, deep links and history, keyboard input and help, denied Fullscreen API fallback, preserved fullscreen navigation, reduced motion, focus, horizontal overflow, WebGL failure, failed wallpaper loading, and rapid channel input. Ambient checks exercise audio gesture gating, volume/mute, power-dependent hum, hidden-tab suspension, reduced-motion changes, and a still-image fallback after context loss. The Windows WebKit test build does not expose Web Audio, so its audio fallback is checked; physical iOS audio still needs a device check. Native Fullscreen API was also checked in Chrome. Set `PLAYWRIGHT_BASE_URL` to test a separately served production export.

## Artwork provenance

Built-in imagegen generated three original bitmap assets. Assets were compressed/resized for delivery; project screenshots were recovered from the original portfolio and are not generated mockups.

- `public/images/room.webp`: original cinematic workspace backdrop.
- `public/images/coast.webp`: original Palawan-inspired coastal wallpaper, an artistic scene rather than a documented location photograph.
- `public/og.png`: original social preview card.

Exact final prompts are saved in `docs/artwork-prompts.md`.
