"use client";

import { motion } from "framer-motion";
import { useI18n } from '@/lib/i18n';

export default function BeforeAboutUs() {
  const { t } = useI18n();

  const paragraphs = ['p1', 'p2', 'p3', 'p4', 'p5'];

  return (
    <section className="container mx-auto pt-32 pb-16" id="company-overview">
      <div className="px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-light text-neutral-900"
          >
            {t('beforeAboutUs.title')}
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="w-24 h-[2px] bg-[#C8A24A] mx-auto mt-6 origin-center"
          />
        </div>

        <div className="space-y-8 text-neutral-600 text-lg md:text-xl font-light leading-relaxed text-center md:text-justify" dir="auto">
          {paragraphs.map((p, index) => (
            <motion.p
              key={p}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index + 0.2 }}
            >
              {t(`beforeAboutUs.${p}`)}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  );
}
