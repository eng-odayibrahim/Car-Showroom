"use client";

import { motion } from "framer-motion";
import { useI18n } from '@/lib/i18n';

const timeline = [
  { key: 'samarra', year: '1985' },
  { key: 'baghdad', year: '1999' },
  { key: 'erbil', year: '2004' },
  { key: 'amman', year: '2006' },
  { key: 'syrianJordanian', year: '2007' },
  { key: 'shipping', year: '2007' },
  { key: 'dubai', year: '2022' },
  { key: 'squareMotors', year: '2023' },
  { key: 'guangzhou', year: '2024' },
  { key: 'rental', year: '2024' },
  { key: 'mauritania', year: '2024' },
  { key: 'spareParts', year: '2026' },
];

export default function About() {
  const { t } = useI18n();

  return (
    <section className="container mx-auto py-32" id="about">
      <div className="px-6">
        <div className="text-center mb-28">
          <h2 className="text-5xl font-light text-neutral-900">
            {t('about.title')}
          </h2>
          <div className="w-24 h-[2px] bg-[#C8A24A] mx-auto mt-6" />
        </div>

        <div className="relative">
          <div className="absolute md:left-1/2 left-4 top-0 bottom-0 w-[1px] bg-neutral-200" />
          <div className="absolute md:left-1/2 left-4 top-0 bottom-0 w-[1px] bg-[#C8A24A]/40" />

          <div className="space-y-20">
            {timeline.map((item, i) => {
              const isLeft = i % 2 === 0;

              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false }}
                  transition={{ delay: i * 0.08 }}
                  className="relative flex"
                >
                  <div className="absolute md:left-1/2 left-4 -translate-x-1/2 w-3 h-3 rounded-full bg-[#C8A24A]" />

                  <div
                    className={`
                      w-full md:w-1/2 pl-12 md:pl-0
                      ${isLeft ? "md:pr-16 md:text-right md:mr-auto" : "md:pl-16 md:ml-auto"}
                    `}
                  >
                    <p className="text-xs md:text-md tracking-[0.3em] text-[#C8A24A]">
                      {item.year}
                    </p>

                    <h3 className="text-xl md:text-3xl font-light text-neutral-900 mt-2">
                      {t(`about.timeline.${item.key}.title`)}
                    </h3>

                    <p className="text-sm md:text-xl text-neutral-500 mt-3 leading-relaxed">
                      {t(`about.timeline.${item.key}.desc`)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
