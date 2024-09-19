import '../styles/globals.css';
import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Layout } from '@/components/Layout';
import App from './index';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'QuantumXFlamies - The Game',
  description:
    'QuantumXFlamies is a game built on MultiversX blockchain. It is a turn-based RPG game where players can battle against OTHER Flamies.',
  viewport: {
    width: 'device-width',
    initialScale: 1
  },
  icons: {
    icon: '/favicon.ico'
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' className={inter.className}>
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-NFWGG37ESJ"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-NFWGG37ESJ');
            `,
          }}
        />
      </head>
      <body>
        <App>
          <Suspense>
            <Layout>{children}</Layout>
          </Suspense>
        </App>
      </body>
    </html>
  );
}
