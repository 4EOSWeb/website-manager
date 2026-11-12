import { Fraunces, IBM_Plex_Sans } from "next/font/google";

export const harborSans = IBM_Plex_Sans({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--harbor-sans",
  display: "swap",
});

export const harborSerif = Fraunces({
  subsets: ["latin"],
  variable: "--harbor-serif",
  display: "swap",
});
