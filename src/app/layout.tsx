import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Health Point Financial Dashboard",
  description: "Health Point financial summary and final details dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#0a0f1a] text-slate-200">
        {children}
      </body>
    </html>
  );
}
