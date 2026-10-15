import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Harbor & Co." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <img src="/mark.svg" alt="" width={32} height={32} />
          <span>Harbor & Co.</span>
        </header>
        {children}
      </body>
    </html>
  );
}
