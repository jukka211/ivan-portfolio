import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ivan Sukhov",
  description: "Brand and Web Designer working across brand strategy, concept, development, visual identity, web design, and web development.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/favicon.ico" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/vgi5cjy.css" />
      </head>
      {/* suppressHydrationWarning: some browser extensions (ad-blockers,
          security toolbars) inject attributes like bis_register onto <body>
          before React hydrates — a real mismatch between extension-modified
          DOM and server output, but not a bug in this app, since the actual
          rendered content is identical either way. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
