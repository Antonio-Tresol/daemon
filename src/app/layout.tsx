import type { Metadata } from 'next';
import { Sidebar } from '@/shared/ui/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Daemon',
  description: 'Deep operations monitor for Claude Code sessions',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex h-full min-h-screen bg-depth-0 text-text-primary font-sans">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </body>
    </html>
  );
}
