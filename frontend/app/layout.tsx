import type { Metadata } from "next";
import { Lora, PT_Serif } from "next/font/google";
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

export const metadata: Metadata = {
  title: "The American Dream Report",
  description: "AIS Datathon newspaper-style interactive report built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lora.variable} ${ptSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-serif">{children}</body>
    </html>
  );
}
