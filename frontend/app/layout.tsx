import type { Metadata } from "next";
import { Inter, Lora, PT_Serif } from "next/font/google";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The American Dream Report",
  description: "Newspaper-style interactive analytics site for AIS Datathon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lora.variable} ${ptSerif.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[var(--font-lora)]">{children}</body>
    </html>
  );
}
