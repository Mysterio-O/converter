import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/layout/sw-register";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MediaForge — local ffmpeg toolkit",
    template: "%s · MediaForge",
  },
  description:
    "Convert, compress and trim images, video and audio entirely in your browser with ffmpeg.wasm. Nothing is ever uploaded to a server — your files stay on your device.",
  keywords: [
    "ffmpeg",
    "media converter",
    "video converter",
    "image converter",
    "compress video",
    "trim video",
    "extract audio",
    "video to gif",
    "privacy",
    "offline",
    "browser",
    "wasm",
  ],
  applicationName: "MediaForge",
  authors: [{ name: "MediaForge" }],
  category: "utilities",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MediaForge",
    startupImage: [{ url: "/apple-touch-icon.png" }],
  },
  openGraph: {
    type: "website",
    siteName: "MediaForge",
    title: "MediaForge — local ffmpeg toolkit",
    description:
      "Convert, compress and trim media entirely in your browser. Nothing is ever uploaded to a server.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "MediaForge — local ffmpeg toolkit",
    description:
      "Convert, compress and trim media entirely in your browser. Nothing is ever uploaded to a server.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EDEBE4" },
    { media: "(prefers-color-scheme: dark)", color: "#14171C" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
        {/* beforeInteractive runs before hydration; raw <script> in JSX is ignored on the client */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('mediaforge-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`}
        </Script>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
