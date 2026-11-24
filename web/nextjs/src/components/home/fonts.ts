import { Inter, Newsreader } from "next/font/google";

/** Fonts for the Vela skin. Themes reference these variables from --font-display and --font-body. */
export const velaDisplay = Newsreader({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-vela-newsreader",
});

export const velaBody = Inter({
  subsets: ["latin"],
  variable: "--font-vela-inter",
});
