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
  title: "CV Hero | AI-Powered ATS Resume Optimizer",
  description: "Transform your CV into an ATS-optimized resume with AI. Get a job-winning CV in seconds. Export to PDF & DOCX.",
  keywords: ["CV Hero", "CV Builder", "ATS Friendly", "Resume Optimizer", "AI Resume", "Job Application", "ATS Resume"],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  openGraph: {
    title: "CV Hero - AI-Powered Resume Optimizer",
    description: "Transform your CV into an ATS-optimized resume with AI. Get a job-winning CV in seconds.",
    type: "website",
    siteName: "CV Hero",
  },
  twitter: {
    card: "summary_large_image",
    title: "CV Hero - AI-Powered Resume Optimizer",
    description: "Transform your CV into an ATS-optimized resume with AI. Get a job-winning CV in seconds.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
