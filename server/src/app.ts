import express, { type Application } from 'express';
import cors                           from 'cors';
import cookieParser                   from 'cookie-parser';
import path                           from 'path';
import { CarRepository }             from './modules/cars/infrastructure/car.repository';
import { DubicarsApiClient }         from './modules/cars/infrastructure/external/dubicars-api.client';
import { CarService }                from './modules/cars/application/car.service';
import { createCarRouter }           from './modules/cars/interfaces/car.controller';
import { createUploadRouter, storageRoot } from './modules/uploads/upload.controller';
import { UserRepository }            from './modules/identity/infrastructure/user.repository';
import { IdentityService }           from './modules/identity/application/identity.service';
import { createIdentityRouter }      from './modules/identity/interfaces/identity.controller';
import { SettingRepository }         from './modules/settings/infrastructure/setting.repository';
import { SettingsService }           from './modules/settings/application/settings.service';
import { createSettingsRouter }      from './modules/settings/interfaces/settings.controller';
import { createTikTokRouter }        from './modules/tiktok/tiktok.controller';
import { errorHandler }              from './shared/errors/error-handler.middleware';
import { startSyncScheduler }        from './shared/scheduler/sync.scheduler';

export async function createApp(): Promise<Application> {
  const app = express();

  // ── Middleware ────────────────────────────────────────
  const allowedOrigins = [
    'https://husseinghulam.com',
    'https://www.husseinghulam.com',
    'http://localhost:3000',
  ];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no Origin header) and listed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' is not allowed`));
      }
    },
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(express.json());
  app.use('/uploads', express.static(path.resolve(storageRoot)));

  // ── Dependency wiring ─────────────────────────────────
  const settingRepo    = new SettingRepository();
  const settingsService = new SettingsService(settingRepo);

  // DubicarsClient uses a credential provider so changes made via the
  // settings page take effect on the next sync (no server restart required).
  const dubicarsClient = new DubicarsApiClient(
    () => settingsService.getDubicarsCredentials()
  );

  const carRepo      = new CarRepository();
  const carService   = new CarService(carRepo, dubicarsClient);
  const identityRepo = new UserRepository();
  const identityService = new IdentityService(identityRepo);

  // ── Routes ────────────────────────────────────────────
  app.use('/api/auth',     createIdentityRouter(identityService));
  app.use('/api/cars',     createCarRouter(carService));
  app.use('/api/uploads',  createUploadRouter());
  app.use('/api/settings', createSettingsRouter(settingsService));
  app.use('/api/tiktok',   createTikTokRouter());

  // Health check
  app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

  // ── Scheduler ─────────────────────────────────────────
  startSyncScheduler(carService);

  // ── Error handler ─────────────────────────────────────
  app.use(errorHandler);

  return app;
}
