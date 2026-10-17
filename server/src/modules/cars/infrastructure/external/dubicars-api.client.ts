// ── Types ─────────────────────────────────────────────────

export interface DubicarsCredentials {
  email:    string;
  password: string;
}

export interface DubicarsAdPayload {
  ad_reference?:         number | string;
  make:                  string;
  model:                 string;
  year:                  number;
  km_driven:             number;
  trim?:                 string;
  export_status?:        'can_be_exported' | 'not_for_export';
  price:                 number;
  regional_specs?:       string;
  steering_side?:        'left' | 'right';
  color?:                string;
  interior_color?:       string;
  body_type?:            string;
  seats?:                number;
  doors?:                number;
  fuel_type?:            string;
  cylinders?:            number;
  drive_type?:           string;
  transmission?:         string;
  engine_size?:          string;
  horse_power?:          number;
  wheel_size?:           number | string;
  mechanical_condition?: string;
  body_condition?:       string;
  warranty?:             boolean;
  warranty_months?:      string;
  additional_info_eng?:  string;
  additional_info_ar?:   string;
  description_eng?:      string;
  vehicle_features?:     string[];
  images:                string[];
}

export interface DubicarsAd extends DubicarsAdPayload {
  id:         number;
  status:     string;
  created_at: string;
  updated_at: string;
}

interface DubicarsListResponseData {
  links: unknown;
  meta:  unknown;
  ads:   DubicarsAd[];
}

interface DubicarsListResponse {
  status: string;
  data:   DubicarsListResponseData;
}

interface DubicarsApiResponse<T = unknown> {
  status:      string;
  status_code: number;
  message:     string;
  data:        T;
  error?:      Record<string, string[]>;
}

// ── Client ────────────────────────────────────────────────

export type DubicarsCredentialProvider = () => Promise<DubicarsCredentials>;

export class DubicarsApiClient {
  readonly #baseUrl:            string;
  readonly #credentialProvider: DubicarsCredentialProvider;

  #token:     string | null = null;
  #expiresAt: number        = 0;           // timestamp ms
  #loginPromise: Promise<void> | null = null; // يمنع login متعدد في نفس الوقت

  constructor(
    credentialsOrProvider: DubicarsCredentials | DubicarsCredentialProvider,
    baseUrl = 'https://www.controlauto.net/integration/v1/api',
  ) {
    // Accept either static credentials object or an async provider function
    if (typeof credentialsOrProvider === 'function') {
      this.#credentialProvider = credentialsOrProvider;
    } else {
      const creds = credentialsOrProvider;
      this.#credentialProvider = async () => creds;
    }
    this.#baseUrl = baseUrl;
  }

  // ── Auth ─────────────────────────────────────────────────

  /**
   * يُستدعى تلقائياً قبل أي طلب
   * إذا الـ token صالح → لا يعمل login جديد
   * إذا منتهي أو غير موجود → يعمل login
   */
  async #ensureAuthenticated(): Promise<void> {
    // Token لا يزال صالحاً (نجدد قبل 5 دقائق من الانتهاء)
    if (this.#token && Date.now() < this.#expiresAt - 5 * 60 * 1000) return;

    // إذا في login جارٍ → انتظر نتيجته بدل فتح login جديد
    if (this.#loginPromise) {
      await this.#loginPromise;
      return;
    }

    this.#loginPromise = this.#doLogin().finally(() => {
      this.#loginPromise = null;
    });

    await this.#loginPromise;
  }

  async #doLogin(): Promise<void> {
    // Fetch latest credentials (from DB or static) right before login
    const credentials = await this.#credentialProvider();

    const body = new URLSearchParams({
      email:    credentials.email,
      password: credentials.password,
    });

    const res = await fetch(`${this.#baseUrl}/login`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept:         'application/json',
      },
      body,
    });

    const json = await res.json() as DubicarsApiResponse<{ token: string; expires_in?: number }>;

    if (!res.ok || json.status === 'error') {
      throw new Error(`DubiCars Login فشل: ${json.message}`);
    }

    this.#token     = json.data.token;
    // إذا API أرجع expires_in (بالثواني) نستخدمه، وإلا نفترض ساعة
    const expiresIn = (json.data.expires_in ?? 3600) * 1000;
    this.#expiresAt = Date.now() + expiresIn;

    console.log(`[DubiCars] ✅ تم تسجيل الدخول — Token صالح حتى ${new Date(this.#expiresAt).toLocaleTimeString('ar')}`);
  }

  // ── Ads ──────────────────────────────────────────────────

  #extractAdsAndMeta(json: any): { ads: DubicarsAd[]; lastPage: number } {
    const payload = json?.data;
    let ads: DubicarsAd[] = [];
    let lastPage = 1;

    if (Array.isArray(payload)) {
      ads = payload as DubicarsAd[];
    } else if (payload && typeof payload === 'object') {
      if (Array.isArray(payload.ads)) {
        ads = payload.ads as DubicarsAd[];
      } else if (Array.isArray(payload.data)) {
        ads = payload.data as DubicarsAd[];
      } else if (Array.isArray(payload.items)) {
        ads = payload.items as DubicarsAd[];
      } else if (Array.isArray(payload.results)) {
        ads = payload.results as DubicarsAd[];
      }

      if (payload.meta && typeof payload.meta.last_page === 'number') {
        lastPage = payload.meta.last_page;
      }
    } else if (json && typeof json === 'object') {
      if (Array.isArray(json.ads)) {
        ads = json.ads as DubicarsAd[];
      } else if (Array.isArray(json.items)) {
        ads = json.items as DubicarsAd[];
      }
      if (json.meta && typeof json.meta.last_page === 'number') {
        lastPage = json.meta.last_page;
      }
    } else if (Array.isArray(json)) {
      ads = json as unknown as DubicarsAd[];
    }

    return { ads, lastPage };
  }

  /**
   * جلب كافة إعلانات المعرض من دبي كار بالتنقل عبر جميع الصفحات (Pagination)
   */
  async getAllAds(): Promise<DubicarsAd[]> {
    const allAds: DubicarsAd[] = [];
    let currentPage = 1;
    let lastPage = 1;

    console.log('[DubiCars] 🔄 بدء سحب جميع الإعلانات عبر التصفح (Pagination)...');

    do {
      const res = await this.#get(`/ads?page=${currentPage}`);
      const json = await this.#parse<any>(res);
      const { ads, lastPage: extractedLastPage } = this.#extractAdsAndMeta(json);

      if (extractedLastPage > lastPage) {
        lastPage = extractedLastPage;
      }

      allAds.push(...ads);

      console.log(`[DubiCars] تم جلب صفحة ${currentPage} من ${lastPage} (إجمالي الإعلانات المسحوبة: ${allAds.length})`);

      if (ads.length === 0) {
        break;
      }

      currentPage++;
      if (currentPage <= lastPage) {
        // تأخير بسيط لتجنب حدوث Rate Limiting
        await new Promise(r => setTimeout(r, 60));
      }
    } while (currentPage <= lastPage);

    console.log(`[DubiCars] ✅ اكتمل سحب كافة الإعلانات: ${allAds.length} إعلاناً من ${lastPage} صفحة.`);
    return allAds;
  }

  async getAds(page = 1, perPage = 100): Promise<DubicarsAd[]> {
    const res  = await this.#get(`/ads?page=${page}&per_page=${perPage}`);
    const json = await this.#parse<any>(res);
    const { ads } = this.#extractAdsAndMeta(json);
    return ads;
  }

  async getAdById(adId: number): Promise<DubicarsAd> {
    const res  = await this.#get(`/ads/${adId}`);
    const json = await this.#parse<DubicarsAd>(res);
    return json.data;
  }

  async getMetadata(): Promise<Record<string, unknown>> {
    const res  = await this.#get('/metadata');
    const json = await this.#parse<Record<string, unknown>>(res);
    return json.data;
  }

  // ── Private HTTP helpers ─────────────────────────────────

  async #get(path: string): Promise<Response> {
    return this.#request('GET', path);
  }

  async #post(path: string, body: unknown): Promise<Response> {
    return this.#request('POST', path, body);
  }

  async #put(path: string, body: unknown): Promise<Response> {
    return this.#request('PUT', path, body);
  }

  async #delete(path: string): Promise<Response> {
    return this.#request('DELETE', path);
  }

  /**
   * الطلب الرئيسي مع retry تلقائي عند 401
   */
  async #request(
    method: string,
    path:   string,
    body?:  unknown,
    retry = true,         // نسمح بـ retry واحد فقط
  ): Promise<Response> {
    await this.#ensureAuthenticated();

    const res = await fetch(`${this.#baseUrl}${path}`, {
      method,
      headers: {
        Authorization:  `Bearer ${this.#token!}`,
        'Content-Type': 'application/json',
        Accept:         'application/json',
      },
      body: body != null ? JSON.stringify(body) : undefined,
    });

    // Token انتهت صلاحيته في الخادم → اعمل login وأعد المحاولة مرة واحدة
    if (res.status === 401 && retry) {
      console.warn('[DubiCars] ⚠️ Token منتهي الصلاحية — إعادة تسجيل الدخول...');
      this.#token     = null;
      this.#expiresAt = 0;
      await this.#ensureAuthenticated();
      return this.#request(method, path, body, false); // retry=false لمنع حلقة لا نهائية
    }

    return res;
  }

  async #parse<T>(res: Response): Promise<DubicarsApiResponse<T>> {
    let json: DubicarsApiResponse<T>;

    try {
      json = await res.json() as DubicarsApiResponse<T>;
    } catch {
      throw new Error(`DubiCars API: فشل تحليل الاستجابة (${res.status})`);
    }

    if (!res.ok || json.status === 'error') {
      const fieldErrors = json.error
        ? Object.entries(json.error)
            .map(([k, v]) => `${k}: ${v.join(', ')}`)
            .join(' | ')
        : '';
      throw new Error(
        `DubiCars API Error ${res.status}: ${json.message}${fieldErrors ? ` — ${fieldErrors}` : ''}`
      );
    }

    return json;
  }
}