import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces/full.css";
import "@fontsource/eb-garamond/400.css";
import "@fontsource/eb-garamond/500.css";
import "@fontsource/eb-garamond/600.css";
import "@fontsource/eb-garamond/400-italic.css";
import "@fontsource/eb-garamond/500-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Build & Bloom Collective · Organizational Wellness & Strategy",
    template: "%s · Build & Bloom Collective",
  },
  description:
    "Organizational wellness and strategy rooted in the Psychology of Care. We help mental health practices, helping organizations, Black entrepreneurs, and community organizations build systems, programs, and gatherings that sustain people.",
  icons: { icon: "/logo.png" },
  openGraph: {
    title: "Build & Bloom Collective",
    description: "Organizational wellness and strategy, rooted in the Psychology of Care.",
    images: ["/logo.png"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F4EFE7",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
