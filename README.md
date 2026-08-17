# Spring Chicken — Website Prototype

## Preview it locally
The site is plain HTML/CSS/JS — no build step. To view it:

```
python3 -m http.server 8123
```

Then open `http://localhost:8123`. (Claude was using this same command via the
`.claude/launch.json` config during the build.)

## Project structure
```
index.html          Homepage
css/base.css         Design tokens: colors, fonts, buttons, shared components
css/home.css          Homepage-specific layout
js/main.js           Mobile nav toggle
assets/fonts/         Avenir + Lobster, converted to .woff2
assets/images/        Optimized, web-sized photos, logo, press logos
```

Raw source files (`Images/`, `Font/`, the loose logo PNG and founder JPG at the
project root) are excluded from git via `.gitignore` — they're large originals
kept locally for reference; the site only ever loads the optimized copies in
`assets/`.

## Open items before this is client-final
- **Avenir font license**: the files in `Font/Avenir/` came from a
  third-party font aggregator site (fontsgeek), not an official Avenir
  distributor. That's fine for this internal prototype, but before a public
  launch you'll want a proper commercial web-font license — via Adobe Fonts
  (if anyone on the team has Creative Cloud) or a paid license from
  Linotype/MyFonts. Swapping the license source later is a one-line change
  in `css/base.css` (`@font-face` `src` paths), nothing else in the site
  depends on where the font file came from.
- **Sticker SVGs**: red dashed circles mark where your badge artwork drops
  in (hero, signature tiles, founder photo, partner photo, locations
  heading) — see `.sticker-slot` in `css/base.css`.
- **"Wraps" tile photo**: no dedicated wrap/burrito photography exists in
  the Images folder yet, so that tile currently uses a grain-bowl shot as
  the closest stand-in.
- **Burbank venue name**: the approved comp shows "Internal Review" there,
  so the site currently shows "Venue TBD" rather than guessing.
- **Digital-tile #3 photo** (kid in red hat): filename pattern suggests it
  was pulled from Pinterest or similar, not original photography — needs a
  properly licensed or client-shot replacement before launch.
- **Nav/CTA links** point to page files that don't exist yet
  (`our-story.html`, `menus.html`, `locations.html`, `franchise.html`).

## Path to publishing
1. Keep iterating locally / with Claude, previewing in the browser as we go.
2. Once you're happy, push this folder to a **Netlify** or **Vercel** free
   account (drag-and-drop the folder, or connect a GitHub repo) — that
   gives you an instant shareable link (e.g. `spring-chicken.netlify.app`)
   the client can click through on their own devices. No domain needed yet.
3. Once approved, point your real domain at that same host — both Netlify
   and Vercel make that a DNS-only change, no rebuild required.
