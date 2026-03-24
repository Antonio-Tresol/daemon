import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/shared/ui/Sidebar';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Claude Command Center',
  description: 'Monitoring dashboard for Claude Code sessions',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} h-full antialiased`}>
      <body className="flex h-full min-h-screen bg-background text-foreground font-sans">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </body>
    </html>
  );
}
