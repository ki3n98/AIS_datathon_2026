import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Is the American Dream Still Achievable?",
  description: "A data science dashboard on income growth, cost of living, wages by industry, and homeownership barriers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
