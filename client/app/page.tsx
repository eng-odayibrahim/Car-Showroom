import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { carsApi } from '../lib/api/cars.api';
import { CarFilters } from '../components/cars/car-filters';
import { CarsGridSkeleton } from '../components/shared/skeletons';
import { AnimatedCarGrid } from '../components/cars/car-animated-grid';
import { FadeIn } from '../components/shared/fade-in';
import type { CarFilters as ICarFilters } from '../types/car.types';
import Hero from '@/components/sections/Hero';
import FAQ from '@/components/sections/Faq';
import OurServices from '@/components/sections/Our-Services';
import TiktokGallery from '@/components/sections/TikTokGallery';
import { SlidersHorizontal, SearchX, X } from 'lucide-react';
import { Translate } from '@/lib/i18n';

export const metadata: Metadata = { title: 'Hussein Ghulam Motors' };

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const filters: ICarFilters = {
    make: sp['make'] || undefined,
    model: sp['model'] || undefined,
    minPrice: sp['minPrice'] ? Number(sp['minPrice']) : undefined,
    maxPrice: sp['maxPrice'] ? Number(sp['maxPrice']) : undefined,
    minYear: sp['minYear'] ? Number(sp['minYear']) : undefined,
    maxYear: sp['maxYear'] ? Number(sp['maxYear']) : undefined,
    page: 1,
    perPage: 6, // 2 rows of 3
  };

  const result = await carsApi.list(filters);
  const hasFilters = Object.values(sp).some(Boolean);

  return (
    <div>
      <Hero />

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row lg:items-start gap-10">

          {/* Sidebar — Filters */}
          <FadeIn>
            <aside className="lg:w-64 shrink-0 lg:sticky lg:top-28 space-y-4 pb-8 lg:pb-0 border-b lg:border-b-0 border-gray-100">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 uppercase tracking-wide">
                <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                <Translate id="common.filterResults" />
              </h2>
              <Suspense fallback={<div className="h-40 animate-pulse bg-gray-50" />}>
                <CarFilters />
              </Suspense>
            </aside>
          </FadeIn>

          {/* Main content — Results */}
          <div className="flex-1 min-w-0 space-y-10">

            <FadeIn delay={0.1}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  <Translate
                    id="common.showingResults"
                    values={{ count: result.data.length, total: result.total }}
                  />
                </p>
                {hasFilters && (
                  <a
                    href="/"
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <X className="w-3 h-3" /> <Translate id="common.removeFilters" />
                  </a>
                )}
              </div>
            </FadeIn>

            {result.data.length === 0 ? (
              <FadeIn>
                <div className="text-center py-24 space-y-4">
                  <SearchX className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="text-xl font-semibold text-gray-900">
                    <Translate id="common.noCarsMatch" />
                  </p>
                  <p className="text-gray-400 text-sm">
                    <Translate id="common.tryFilters" />
                  </p>
                  <a
                    href="/"
                    className="inline-block mt-2 px-6 py-2.5 bg-[#050505] text-white text-sm hover:bg-[#050505]/80 transition-colors"
                  >
                    <Translate id="common.showAllCars" />
                  </a>
                </div>
              </FadeIn>
            ) : (
              <>
                <Suspense fallback={<CarsGridSkeleton count={6} />}>
                  <AnimatedCarGrid cars={result.data} />
                </Suspense>

                <FadeIn delay={0.15}>
                  <div className="flex justify-center pt-4">
                    <Link
                      href="/cars"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#050505] text-white text-sm hover:bg-[#050505]/80 transition-colors"
                    >
                      <Translate id="common.showAllCars" />
                    </Link>
                  </div>
                </FadeIn>
              </>
            )}
          </div>
        </div>
      </div>

      <OurServices />
      <FAQ />
      <TiktokGallery />
    </div>
  );
}