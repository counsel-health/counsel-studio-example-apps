# Vela themes

Each file here is tokens only, scoped by `[data-theme="<partner>"]` on the Vela app root.
Components read these variables and never hard-code colors, fonts, radii or durations.

To add a partner skin:

1. Copy `vela.css` to `<partner>.css` and change the values.
2. Import it in `../VelaApp.tsx` and add `<partner>` to `VELA_THEMES` in `src/lib/vela.ts`.
3. If it uses web fonts, load them with `next/font` in `../fonts.ts`, add their `.variable`
   class to the app root, and reference the variables from `--font-display` / `--font-body`.

Open `/vela?theme=<partner>` to see it.

| Group | Used by |
| --- | --- |
| `--font-*` | Display and body type |
| `--app-*` | Home: page, cards, chart, tiles |
| `--care-*` | The "Get care" button |
| `--chat-*` | The takeover's background, header and slide durations |

The conversation inside the takeover is the Counsel embed, which has its own theming
(`view.theme` in the session data), so the handoff's message, action card and composer
tokens aren't here.
