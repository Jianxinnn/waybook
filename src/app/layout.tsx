import type { Metadata } from 'next';
import { Suspense } from 'react';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Waybook',
  description: 'A local-first research memory backbone for AI-native work'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div>{children}</div>}>
          <WorkspaceShell>{children}</WorkspaceShell>
        </Suspense>
      </body>
    </html>
  );
}
