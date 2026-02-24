import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GCC Pulse",
  description: "GCC credit ratings and deals pulse dashboard (MVP).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
