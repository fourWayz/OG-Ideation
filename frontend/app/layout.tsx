import { Inter, Poppins } from 'next/font/google';
import { Providers } from './providers';
import { Header } from '@/app/components/layout/Header';
import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins'
});

export const metadata = {
  title: 'ChainChat AI - Modern Social Platform',
  description: 'Next-gen social media powered by OG Chain',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}