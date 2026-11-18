# Brand themes

Each file here is tokens only, scoped by `[data-theme="<brand>"]` on the dashboard home's root
(`src/components/home/HomePage.tsx`). Components read these variables and never hard-code colors,
fonts, radii or durations.

- `studio.css` is the default. It's built from the app-wide tokens in `src/app/globals.css`, so the
  home matches the other tabs.
- `vela.css` is the Vela partner skin from the design handoff.
- `example.css` is a made-up skin that shows a reskin is tokens only.

To add a brand:

1. Copy `vela.css` to `<brand>.css` and change the values.
2. Import it in `src/components/home/HomePage.tsx` and add `<brand>` to `BRANDS` in
   `src/lib/brands.ts`.
3. If it uses web fonts, load them with `next/font` in `src/components/home/fonts.ts`, add their
   `.variable` class to the home root, and reference the variables from `--font-display` /
   `--font-body`.
4. If it has its own logo, add a case to `BrandLogo` in `src/components/home/icons.tsx`. Otherwise
   the chat header shows the brand's name.

Open `/dashboard?theme=<brand>` to see it.

| Group | Used by |
| --- | --- |
| `--font-*` | Display and body type |
| `--app-*` | Home: page, cards, chart, tiles |
| `--care-*` | The "Get care" button |
| `--chat-*` | The chat takeover's background, header and slide durations |

The conversation inside the takeover is the Counsel embed, which has its own theming
(`view.theme` in the session data), so there are no message, action card or composer tokens here.
