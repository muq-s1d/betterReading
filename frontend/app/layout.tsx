import type { Metadata, Viewport } from "next";
import { Lora, DM_Sans, Merriweather, EB_Garamond, Source_Code_Pro } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-merriweather",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "betterReading",
  description: "AI-powered e-reader with adaptive mood music",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lora.variable} ${dmSans.variable} ${merriweather.variable} ${ebGaramond.variable} ${sourceCodePro.variable}`}
      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
    >
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
