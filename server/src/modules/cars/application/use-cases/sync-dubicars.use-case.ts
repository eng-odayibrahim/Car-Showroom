import { Car }                  from '../../domain/car.js';
import { CarSource }            from '../../domain/car-source.js';
import type { CarProps }        from '../../domain/car.types.js';
import type { CarRepository }   from '../../infrastructure/car.repository.js';
import type { DubicarsApiClient, DubicarsAd } from '../../infrastructure/external/dubicars-api.client.js';

export interface SyncResult {
  added:   number;
  updated: number;
  deleted: number;
  errors:  Array<{ dubicarsAdId: number; error: string }>;
}

export class SyncFromDubicarsUseCase {
  constructor(
    private readonly repo:           CarRepository,
    private readonly dubicarsClient: DubicarsApiClient,
  ) {}

  async execute(): Promise<SyncResult> {
    const result: SyncResult = { added: 0, updated: 0, deleted: 0, errors: [] };

    // 1. جلب كل إعلانات المعرض من دبي كار عبر جميع الصفحات (Pagination)
    const ads = await this.dubicarsClient.getAllAds();
    if (!Array.isArray(ads)) {
      throw new Error('DubiCars API returned invalid ads payload.');
    }

    const activeIds = ads.map(ad => ad.id);

    console.log(`[Sync] 🚗 جاري مزامنة وتحديث ${ads.length} إعلاناً في قاعدة البيانات...`);

    // 2. معالجة كل إعلان
    let processedCount = 0;
    for (const ad of ads) {
      try {
        const existing = await this.repo.findByDubicarsAdId(ad.id);
        const mappedStatus = this.#mapStatus(ad.status);
        const domainProps = this.#toDomainProps(ad);

        if (existing) {
          // موجود → حدّث البيانات والحالة عبر syncFromDubicars
          const updated = existing.syncFromDubicars(domainProps, mappedStatus);
          await this.repo.save(updated);
          result.updated++;
        } else {
          // جديد → أضفه
          const car = new Car({
            ...domainProps,
            source: CarSource.dubicars(ad.id),
            status: mappedStatus,
          } as CarProps);
          await this.repo.save(car.recordSync());
          result.added++;
        }
      } catch (err) {
        result.errors.push({
          dubicarsAdId: ad.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      processedCount++;
      if (processedCount % 100 === 0 || processedCount === ads.length) {
        console.log(`[Sync] تمت معالجة ${processedCount} / ${ads.length} سيارة...`);
      }
    }

    // 3. سيارات اختفت من دبي كار نهائياً → علّمها deleted
    result.deleted = await this.repo.markDeletedIfAdIdNotIn(activeIds);

    console.log(
      `[Sync] ✅ اكتملت المزامنة — أُضيف: ${result.added} | حُدّث: ${result.updated} | حُذف: ${result.deleted} | أخطاء: ${result.errors.length}`
    );

    return result;
  }

  // ── Map DubicarsAd → CarProps ────────────────────────

  #toDomainProps(ad: DubicarsAd): Partial<CarProps> {
    return {
      make:                ad.make,
      model:               ad.model,
      year:                ad.year,
      price:               ad.price,
      kmDriven:            ad.km_driven,
      trim:                ad.trim                  ?? null,
      color:               ad.color                 ?? null,
      interiorColor:       ad.interior_color        ?? null,
      bodyType:            ad.body_type             ?? null,
      fuelType:            ad.fuel_type             ?? null,
      transmission:        ad.transmission          ?? null,
      cylinders:           ad.cylinders             ?? null,
      driveType:           ad.drive_type            ?? null,
      engineSize:          ad.engine_size           ?? null,
      seats:               ad.seats                 ?? null,
      doors:               ad.doors                 ?? null,
      horsePower:          ad.horse_power           ?? null,
      wheelSize:           ad.wheel_size != null ? String(ad.wheel_size) : null,
      mechanicalCondition: ad.mechanical_condition  ?? null,
      bodyCondition:       ad.body_condition        ?? null,
      regionalSpecs:       ad.regional_specs        ?? null,
      exportStatus:        ad.export_status         ?? null,
      steeringSide:        ad.steering_side         ?? 'left',
      warranty:            ad.warranty              ?? false,
      warrantyMonths:      ad.warranty_months       ?? null,
      images:              ad.images                ?? [],
      features:            ad.vehicle_features      ?? [],
      descriptionEn:       ad.description_eng       ?? null,
      additionalInfoEn:    ad.additional_info_eng   ?? null,
      additionalInfoAr:    ad.additional_info_ar    ?? null,
      adReference:         ad.ad_reference != null ? String(ad.ad_reference) : null,
    };
  }

  #mapStatus(apiStatus: string): 'active' | 'paused' | 'sold' | 'deleted' {
    const map: Record<string, 'active' | 'paused' | 'sold' | 'deleted'> = {
      active:   'active',
      paused:   'paused',
      inactive: 'paused',
      sold:     'sold',
      deleted:  'deleted',
    };
    return map[apiStatus?.toLowerCase()] ?? 'active';
  }
}