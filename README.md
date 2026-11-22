# AutoSimiX website

The product website: one page that introduces AutoSimiX and sends visitors
to the app on Google Play. Plain HTML, CSS and JavaScript: no framework, no
build step, no tracking, no cookies.

```
index.html          the page
css/style.css       the design
js/main.js          menu, animations, live oscilloscope, photos
assets/img/         logo, icons, share image
assets/screens/     app screenshots
assets/photos/      YOUR photos (see below)
```

## See it on your PC

Double-click `index.html`: it opens in your browser. Everything works
offline.

## Add your photos

Put your photos in `assets/photos/` with exactly these names. Each one
appears by itself as soon as the file is there. Until then, the designed
placeholder (drawn device, gradients) is shown.

| File | Where | Best format |
|---|---|---|
| `hero.jpg` | Full-screen background at the top (replaces the drawn device) | Landscape, at least 2400 × 1350, dark background, the device in the middle |
| `device.jpg` | Above the specs | Wide, about 16:7, at least 1800 px wide |
| `workshop.jpg` | "For professionals" tile | Landscape, the device in use in a garage |
| `enthusiast.jpg` | "For enthusiasts" tile | Landscape, a car / engine bay |

Keep each file under ~500 KB: export as JPEG, quality 80. Squoosh
(squoosh.app) does it in the browser.

## Change the Google Play link

At the top of `js/main.js`:

```js
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.yassine.autosimix';
```

Every "Get it on Google Play" button uses it. The link only works once the
app is published on Google Play.

## Put it online (free)

**GitHub Pages**, like the privacy policy:

1. Create a new **public** repository on GitHub, e.g. `autosimix-website`.
2. Upload the contents of this folder (index.html at the root).
3. Repository → Settings → Pages → Source: *Deploy from a branch*, branch
   `main`, folder `/ (root)`.
4. After a minute the site is at
   `https://yassinekaraouli.github.io/autosimix-website/`.

**Your own domain** (e.g. `autosimix.com`): buy it from any registrar, then
in Settings → Pages → Custom domain enter it and follow GitHub's DNS
instructions. HTTPS is free.

Other free hosts that also work by dropping this folder in: Netlify
(netlify.com/drop), Cloudflare Pages, or Firebase Hosting (your existing
Firebase project: `firebase init hosting`, then `firebase deploy --only
hosting`).

## Edit the text

All text is in `index.html`, one section after the other (Read, Guide,
Reference, Emulate, App, Made for, Specs). The colors are at the top of
`css/style.css` (`--brand` is the AutoSimiX blue).
