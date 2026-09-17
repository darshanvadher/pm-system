import type { Metadata } from "next";
import "./globals.css";

// next/font requires SWC and cannot be used with a custom Babel config.
// Replaced with a plain Google Fonts stylesheet in globals.css instead.

export const metadata: Metadata = {
  title: "PM System",
  description: "Project Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
