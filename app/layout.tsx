import type { Metadata } from "next";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ayer Khali Abrio — Full Stack Developer | On Air",
  description: "Full Stack Developer in Palawan, Philippines. Explore my web applications, client systems, and machine learning projects through an interactive retro CRT portfolio.",
  metadataBase: new URL("https://ayer-crt-portfolio.m1st021.chatgpt.site"),
  openGraph: { title: "Ayer Khali Abrio — Full Stack Developer", description: "Web applications, software systems, and a little analog nostalgia. Tune in to my portfolio.", type: "website", images: [{ url: "/og.png", width: 1672, height: 941, alt: "Ayer Khali Abrio's retro CRT portfolio" }] },
  twitter: { card: "summary_large_image", title: "Ayer Khali Abrio — Full Stack Developer", images: ["/og.png"] },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
