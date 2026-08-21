'use client';

import { useI18n } from '@/lib/i18n';
import { siFacebook, siInstagram, siTiktok } from 'simple-icons/icons';

const QuickLinks = [
  { nameKey: 'navbar.home', link: '/' },
  { nameKey: 'navbar.cars', link: '/cars' },
  { nameKey: 'navbar.about', link: '/about' },
  { nameKey: 'navbar.contact', link: '/contact' },
];

const Brands = [
  { nameKey: 'brands.names.toyota',  make: 'Toyota'  },
  { nameKey: 'brands.names.nissan',  make: 'Nissan'  },
  { nameKey: 'brands.names.honda',   make: 'Honda'   },
  { nameKey: 'brands.names.tata',    make: 'Tata'    },
  { nameKey: 'brands.names.hyundai', make: 'Hyundai' },
];

const policies = [
  { nameKey: 'footer.privacy', link: '/privacy' },
  { nameKey: 'footer.terms', link: '/terms' },
];

const Social = [
  { link: 'https://www.facebook.com/husseinghulammotorsfzco', icon: siFacebook },
  { link: 'https://www.instagram.com/husseinghulammotors', icon: siInstagram },
  { link: 'https://www.tiktok.com/@hussein_gulam?is_from_webapp=1&sender_device=pc', icon: siTiktok},
];

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="relative w-full py-16 overflow-hidden" id="contact">
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-900 to-black" />
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-[#C8A24A]/10 blur-3xl" />

      <div className="relative">
        <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-neutral-400">
          <div>
            <h3 className="text-white text-lg font-medium mb-5">{t('footer.contactTitle')}</h3>
            <p className="text-sm leading-relaxed">{t('footer.contactText')}</p>
          </div>

          <div>
            <h3 className="text-white text-lg font-medium mb-5">{t('footer.quickLinks')}</h3>
            <ul className="space-y-3 text-sm">
              {QuickLinks.map((link, i) => (
                <li key={i}>
                  <a href={link.link} className="group inline-block relative hover:text-white transition duration-200">
                    {t(link.nameKey)}
                    <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-[#C8A24A] group-hover:w-full transition-all duration-200" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

         <div>
  <h3 className="text-white text-lg font-medium mb-5">{t('footer.ourBrands')}</h3>
  <ul className="space-y-3 text-sm">
    {Brands.map((brand, i) => (
      <li key={i}>
        <a
          href={`/cars?make=${encodeURIComponent(brand.make)}&page=1&perPage=12`}
          className="group inline-block relative hover:text-white transition duration-200"
        >
          {t(brand.nameKey)}
          <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-[#C8A24A] group-hover:w-full transition-all duration-200" />
        </a>
      </li>
    ))}
  </ul>
</div>
          <div>
            <h3 className="text-white text-lg font-medium mb-5">{t('footer.connectionTitle')}</h3>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li>{t('footer.emailLabel')}: info@husseinghulammotors.com</li>
              <li>{t('footer.phoneLabel')}: +971 54 314 1978</li>
              <li>{t('footer.locationLabel')}: Dubai, UAE</li>
            </ul>

            <div className="flex gap-4 mt-6">
              {Social.map((social, i) => (
                <a
                  key={i}
                  className="w-9 h-9 flex items-center justify-center border border-neutral-700 rounded-full text-neutral-400 hover:text-white hover:border-[#C8A24A] transition duration-200"
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path d={social.icon.path} fill="currentColor" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
            <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
            <div className="flex gap-6">
              {policies.map((item, i) => (
                <a
                  key={i}
                  className="hover:text-white transition duration-200"
                  href={item.link}
                >
                  {t(item.nameKey)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
