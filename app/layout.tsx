import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MetricLab Vistoria Cautelar',
  description: 'Vistoria Cautelar — Consorcio Pacote 15 e 19',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MetricLab Vistoria',
  },
};

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
    <html lang="pt-BR" className={`${inter.variable} bg-[#F5F5F5]`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.className} bg-[#F5F5F5] text-gray-900 min-h-screen antialiased flex flex-col items-center selection:bg-blue-100 selection:text-blue-900`}>
        <div className="w-full max-w-md min-h-screen flex flex-col bg-[#F5F5F5] sm:shadow-md sm:border-x sm:border-gray-200 relative">
          {children}
        </div>
      </body>
    </html>
  );
}
