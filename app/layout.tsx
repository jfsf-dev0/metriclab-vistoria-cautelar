import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://vistoria.metriclab.com.br'),
  title: 'Vistoria de Campo · MetricLab',
  description: 'Checklist parametrizável, registro fotográfico com geotag e assinatura digital. Funciona offline. Acesse pelo celular.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MetricLab Vistoria',
  },
  openGraph: {
    title: 'Vistoria de Campo · MetricLab',
    description: 'Checklist parametrizável, registro fotográfico com geotag e assinatura digital. Funciona offline. Acesse pelo celular.',
    url: 'https://vistoria.metriclab.com.br',
    siteName: 'MetricLab',
    images: [
      {
        url: 'https://vistoria.metriclab.com.br/og-image.jpg',
        secureUrl: 'https://vistoria.metriclab.com.br/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Vistoria de Campo · MetricLab',
        type: 'image/jpeg',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vistoria de Campo · MetricLab',
    description: 'Checklist parametrizável, registro fotográfico com geotag e assinatura digital. Funciona offline.',
    images: ['https://vistoria.metriclab.com.br/og-image.jpg'],
  },
};

import { PwaManager } from '@/components/pwa/PwaManager';

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} bg-[#F0F0F0]`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta property="og:title" content="Vistoria de Campo · MetricLab" />
        <meta property="og:description" content="Checklist parametrizável, registro fotográfico com geotag e assinatura digital. Funciona offline. Acesse pelo celular." />
        <meta property="og:image" content="https://vistoria.metriclab.com.br/og-image.jpg" />
        <meta property="og:image:secure_url" content="https://vistoria.metriclab.com.br/og-image.jpg" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Vistoria de Campo · MetricLab" />
        <meta property="og:url" content="https://vistoria.metriclab.com.br" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MetricLab" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Vistoria de Campo · MetricLab" />
        <meta name="twitter:description" content="Checklist parametrizável, registro fotográfico com geotag e assinatura digital. Funciona offline." />
        <meta name="twitter:image" content="https://vistoria.metriclab.com.br/og-image.jpg" />
      </head>
      <body className={`${inter.className} bg-[#F0F0F0] text-gray-900 min-h-screen antialiased flex flex-col w-full selection:bg-neutral-200 selection:text-neutral-900`}>
        <div className="w-full min-h-screen flex flex-col relative">
          <PwaManager />
          {children}
        </div>
      </body>
    </html>
  );
}
