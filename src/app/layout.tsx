import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Achievement Hub — Student Achievement Extractor & Portfolio",
  description: "AI-powered achievement extraction and verified portfolio management for engineering students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[#FAF8F5] text-navy-900 antialiased flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-cream-border py-6 text-center text-xs text-navy-700/60 bg-[#FAF8F5]">
            <p>
              Achievement Hub &bull; Design Thinking Project &bull; Extraction is not verification; students verify all records.
            </p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
