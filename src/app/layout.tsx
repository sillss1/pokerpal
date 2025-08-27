import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Inter } from 'next/font/google';

export const metadata: Metadata = {
  title: 'PokerPal',
  description: 'Track your poker sessions with friends.',
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${inter.className}`}>
      <body className="antialiased h-full bg-background gradient-background">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
