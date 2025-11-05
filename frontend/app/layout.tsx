import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORE Mining Dashboard",
  description: "Real-time ORE mining grid and statistics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
