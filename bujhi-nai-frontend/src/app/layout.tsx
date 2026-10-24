import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Hind_Siliguri } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-bangla",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "বুঝি নাই — হোয়াইটবোর্ড থেকে সহজ বাংলা নোট",
  description:
    "ক্লাসের মেসি হোয়াইটবোর্ডের ছবি দাও, ভয়েসে প্রশ্ন করো — Gemma 4 স্টেপ-বাই-স্টেপ বাংলা ব্যাখ্যা, পরীক্ষার শর্টকাট আর প্র্যাকটিস প্রশ্ন বানিয়ে দেবে।",
  applicationName: "Bujhi Nai",
  icons: { icon: "/logo.png" },
  keywords: ["IIUC", "Bujhi Nai", "Bangla notes", "whiteboard", "Gemma 4", "study"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08110f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="bn"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${hindSiliguri.variable}`}
    >
      <body className="min-h-dvh antialiased">
        <TooltipProvider delayDuration={250}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
