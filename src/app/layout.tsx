'use client';

import { Inter, Outfit, Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';

import { Toaster } from "@/components/ui/toaster";
import { DataProvider } from '@/context/DataContext';

// Khai báo các font chữ mới
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
});

// Component RootLayout DUY NHẤT VÀ HOÀN CHỈNH
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${inter.variable} ${outfit.variable} ${beVietnamPro.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <DataProvider>
          {children}
          <Toaster />
        </DataProvider>
      </body>
    </html>
  );
}
