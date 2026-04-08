
import type {Metadata} from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Toaster } from '@/components/ui/toaster';
import { PixelCartProvider } from '@/lib/store';
import { FirebaseClientProvider } from '@/firebase';
import { Inter } from 'next/font/google';
import { Footer } from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Outilya DZ | Outillage Professionnel',
  description: 'Votre partenaire pour l\'outillage professionnel en Algérie.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable}`}>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <FirebaseClientProvider>
          <PixelCartProvider>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <Toaster />
          </PixelCartProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
