import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Waybook',
  description: 'A local-first research memory backbone for AI-native work'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
