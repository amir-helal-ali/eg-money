import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

const inter = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-num",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#10b981",
};

export const metadata: Metadata = {
  title: "Eg-Money — منصة تداول USDT بالجنيه المصري",
  description: "منصة مصرية متكاملة لبيع وشراء USDT مقابل الجنيه المصري، بأسعار السوق الحية ونظام ضمان Escrow وأمان مصرفي.",
  keywords: ["Eg-Money", "USDT", "EGP", "تداول", "P2P", "كريبتو", "مصر"],
  authors: [{ name: "Eg-Money" }],
  manifest: "/manifest.json",
  applicationName: "Eg-Money",
  appleWebApp: {
    capable: true,
    title: "Eg-Money",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/favicon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/brand/favicon-256.png", sizes: "256x256", type: "image/png" },
    ],
    shortcut: "/brand/favicon.ico",
    apple: [
      { url: "/brand/favicon-128.png", sizes: "128x128", type: "image/png" },
      { url: "/brand/favicon-256.png", sizes: "256x256", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Eg-Money — تداول USDT بالجنيه المصري",
    description: "بِع واشترِ USDT بأسعار السوق الحية. تداول مباشر، سوق P2P ذكي، وإيداع وسحب عبر فودافون كاش وإنستا باي.",
    type: "website",
    locale: "ar_EG",
    siteName: "Eg-Money",
    images: [{ url: "/brand/og-image.png", width: 256, height: 256, alt: "Eg-Money" }],
  },
  twitter: {
    card: "summary",
    title: "Eg-Money — تداول USDT بالجنيه المصري",
    description: "بِع واشترِ USDT بأسعار السوق الحية.",
    images: ["/brand/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className="dark">
      <head>
        {/* Structured data for SEO (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FinancialService',
              name: 'Eg-Money',
              description: 'منصة مصرية متكاملة لبيع وشراء USDT مقابل الجنيه المصري',
              url: 'https://eg-money.com',
              logo: '/brand/favicon-256.png',
              areaServed: 'EG',
              serviceType: 'Cryptocurrency Trading',
              currenciesAccepted: 'EGP, USDT',
              availableLanguage: ['ar', 'en'],
              offers: {
                '@type': 'Offer',
                description: 'تداول مباشر + سوق P2P بنظام ضمان Escrow',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                reviewCount: '1200',
              },
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <PwaInstallPrompt />
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  );
}
