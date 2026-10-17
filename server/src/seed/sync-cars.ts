import 'dotenv/config';
import mongoose from 'mongoose';
import { SettingRepository } from '../modules/settings/infrastructure/setting.repository.js';
import { SettingsService }   from '../modules/settings/application/settings.service.js';
import { DubicarsApiClient } from '../modules/cars/infrastructure/external/dubicars-api.client.js';
import { CarRepository }     from '../modules/cars/infrastructure/car.repository.js';
import { CarService }        from '../modules/cars/application/car.service.js';

async function runSync() {
  try {
    const mongoUri = process.env['MONGODB_URI'] || 'mongodb://root:1234@db:27017/cars?authSource=admin';
    console.log(`[Sync Script] الاتصال بقاعدة البيانات...`);
    await mongoose.connect(mongoUri);
    console.log('[Sync Script] ✓ تم الاتصال بـ MongoDB بنجاح.');

    const settingRepo     = new SettingRepository();
    const settingsService = new SettingsService(settingRepo);

    const dubicarsClient = new DubicarsApiClient(
      () => settingsService.getDubicarsCredentials()
    );

    const carRepo    = new CarRepository();
    const carService = new CarService(carRepo, dubicarsClient);

    console.log('[Sync Script] 🚀 بدء تشغيل المزامنة الكاملة مع دبي كار...');
    const result = await carService.sync();

    console.log('\n=============================================');
    console.log('✅ اكتملت المزامنة بنجاح!');
    console.log(`- سيارات جديدة أُضيفت: ${result.added}`);
    console.log(`- سيارات تم تحديثها واستعادتها: ${result.updated}`);
    console.log(`- سيارات محذوفة من دبي كار: ${result.deleted}`);
    console.log(`- أخطاء إن وجدت: ${result.errors.length}`);
    if (result.errors.length > 0) {
      console.warn('الأخطاء:', result.errors);
    }
    console.log('=============================================\n');

    await mongoose.connection.close();
    console.log('[Sync Script] ✓ تم إغلاق الاتصال بـ MongoDB.');
  } catch (err) {
    console.error('[Sync Script] ❌ حدث خطأ أثناء المزامنة:', err);
    process.exit(1);
  }
}

runSync();
