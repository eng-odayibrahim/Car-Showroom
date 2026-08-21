import './globals.css';
import type { Metadata } from 'next';
import FooterWrapper from '../components/shared/footer-wrapper';
import {Navbar} from '@/components/shared/navbar';
import { I18nProvider } from '@/lib/i18n';
import IntroScreen from '@/components/shared/intro-screen';
import WhatsAppWidget from '@/components/shared/whatsapp-widget';

export const metadata: Metadata = {
  title: {
    default: 'Hussein Ghulam Motors',
    template: '%s | Hussein Ghulam Motors',
  },
  description: 'Hussein Ghulam Motors is a car dealership that specializes in selling high-quality vehicles. We offer a wide selection of cars, trucks, and SUVs to meet your needs.',
 icons:{
  icon:"./images/logo.jpg",
 }
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <I18nProvider>
          <IntroScreen />
          <Navbar />
          <main className="flex-1">{children}</main>
          <FooterWrapper />
          <WhatsAppWidget />
        </I18nProvider>
      </body>
    </html>
  );
}
