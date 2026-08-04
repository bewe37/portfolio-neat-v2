import type { Metadata } from "next"
import "./globals.css"
import PageTransition from "@/components/PageTransition"
import ScrollToTop from "@/components/ScrollToTop"
import SharedNav from "@/components/SharedNav"
import MobileMenu from "@/components/MobileMenu"
import { Geist, Playfair_Display, Gabriela } from "next/font/google";
import { cn } from "@/lib/utils";
import { Analytics } from '@vercel/analytics/next';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });
const gabriela = Gabriela({ subsets: ['latin'], weight: '400', variable: '--font-gabriela', display: 'swap' });

export const metadata: Metadata = {
  title: "Georgius Bryan",
  description: "Product designer who gives complicated tools a reason to feel beautiful.",
  openGraph: {
    title: "Georgius Bryan",
    description: "Product designer who gives complicated tools a reason to feel beautiful.",
    url: "https://georgiusbw.com",
    siteName: "Georgius Bryan",
    images: [
      {
        url: "https://georgiusbw.com/siteThumbnail.png",
        width: 1200,
        height: 630,
        alt: "Georgius Bryan – Product Designer",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Georgius Bryan",
    description: "Product designer who gives complicated tools a reason to feel beautiful.",
    images: ["https://georgiusbw.com/siteThumbnail.png"],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable, playfair.variable, gabriela.variable)}>
      <head>
        <link rel="preload" href="/roses.png" as="image" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){if(localStorage.getItem('theme')==='light')document.body&&document.body.classList.remove('dark')})()` }} />
      </head>
      <body className="dark">
        <ScrollToTop />
        <SharedNav />
        <MobileMenu />
        <PageTransition>{children}</PageTransition>
        <Analytics />
      </body>
    </html>
  )
}
