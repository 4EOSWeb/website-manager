import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HarborNav } from "@/components/harbor-nav";
import { harborSans, harborSerif } from "./fonts";
import "./harbor.css";

export const metadata: Metadata = { title: "Harbor & Co." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${harborSans.variable} ${harborSerif.variable}`}>
      <body style={{ fontFamily: "var(--harbor-sans), sans-serif" }}>
        <header>
          <img src="/mark.svg" alt="" width={32} height={32} />
          <span>Harbor & Co.</span>
          <HarborNav />
        </header>
        {children}
      </body>
    </html>
  );
}
