import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smith & Adams — Lead Intelligence",
  description: "Meta Ads + Pipedrive unified dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
