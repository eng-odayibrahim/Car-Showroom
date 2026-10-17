import { CarStatus }     from './car-status';
import { CarSource }     from './car-source';
import type { CarProps } from './car.types';

export class Car {
  // ── Identity ─────────────────────────────────────────
  readonly #id:     string | null;
  readonly #source: CarSource;
  readonly #status: CarStatus;

  // ── Core ─────────────────────────────────────────────
  readonly #make:     string;
  readonly #model:    string;
  readonly #year:     number;
  readonly #trim:     string | null;
  readonly #price:    number;
  readonly #kmDriven: number;

  // ── Specs ─────────────────────────────────────────────
  readonly #color:          string | null;
  readonly #interiorColor:  string | null;
  readonly #bodyType:       string | null;
  readonly #fuelType:       string | null;
  readonly #transmission:   string | null;
  readonly #cylinders:      number | null;
  readonly #driveType:      string | null;
  readonly #engineSize:     string | null;
  readonly #seats:          number | null;
  readonly #doors:          number | null;
  readonly #horsePower:     number | null;
  readonly #wheelSize:      string | null;

  // ── Condition ─────────────────────────────────────────
  readonly #mechanicalCondition: string | null;
  readonly #bodyCondition:       string | null;

  // ── Compliance ────────────────────────────────────────
  readonly #regionalSpecs: string | null;
  readonly #exportStatus:  string | null;
  readonly #steeringSide:  'left' | 'right';

  // ── Warranty ──────────────────────────────────────────
  readonly #warranty:       boolean;
  readonly #warrantyMonths: string | null;

  // ── Media & Content ───────────────────────────────────
  readonly #images:           string[];
  readonly #features:         string[];
  readonly #descriptionEn:    string | null;
  readonly #descriptionAr:    string | null;
  readonly #additionalInfoEn: string | null;
  readonly #additionalInfoAr: string | null;
  readonly #adReference:      string | null;

  // ── Timestamps ────────────────────────────────────────
  readonly #createdAt:      Date;
  readonly #updatedAt:      Date;
  readonly #dubicarssyncdAt: Date | null;

  constructor(props: CarProps) {
    this.#validate(props);

    this.#id = props.id ?? null;

    this.#source =
      props.source instanceof CarSource
        ? props.source
        : CarSource.from(props.source as string, props.dubicarsAdId);

    this.#status =
      props.status instanceof CarStatus
        ? props.status
        : CarStatus.from((props.status as string | undefined) ?? 'active');

    this.#make     = props.make;
    this.#model    = props.model;
    this.#year     = Number(props.year);
    this.#trim     = props.trim     ?? null;
    this.#price    = Number(props.price);
    this.#kmDriven = Number(props.kmDriven ?? 0);

    this.#color         = props.color         ?? null;
    this.#interiorColor = props.interiorColor  ?? null;
    this.#bodyType      = props.bodyType       ?? null;
    this.#fuelType      = props.fuelType       ?? null;
    this.#transmission  = props.transmission   ?? null;
    this.#cylinders     = props.cylinders  != null ? Number(props.cylinders)  : null;
    this.#driveType     = props.driveType      ?? null;
    this.#engineSize    = props.engineSize     ?? null;
    this.#seats         = props.seats      != null ? Number(props.seats)      : null;
    this.#doors         = props.doors      != null ? Number(props.doors)      : null;
    this.#horsePower    = props.horsePower != null ? Number(props.horsePower)  : null;
    this.#wheelSize     = props.wheelSize      ?? null;

    this.#mechanicalCondition = props.mechanicalCondition ?? null;
    this.#bodyCondition       = props.bodyCondition       ?? null;

    this.#regionalSpecs = props.regionalSpecs ?? null;
    this.#exportStatus  = props.exportStatus  ?? null;
    this.#steeringSide  = props.steeringSide  ?? 'left';

    this.#warranty       = Boolean(props.warranty ?? false);
    this.#warrantyMonths = props.warrantyMonths ?? null;

    this.#images           = props.images   ? [...props.images]   : [];
    this.#features         = props.features ? [...props.features] : [];
    this.#descriptionEn    = props.descriptionEn    ?? null;
    this.#descriptionAr    = props.descriptionAr    ?? null;
    this.#additionalInfoEn = props.additionalInfoEn ?? null;
    this.#additionalInfoAr = props.additionalInfoAr ?? null;
    this.#adReference      = props.adReference      ?? null;

    this.#createdAt       = props.createdAt       ? new Date(props.createdAt as string)       : new Date();
    this.#updatedAt       = props.updatedAt       ? new Date(props.updatedAt as string)       : new Date();
    this.#dubicarssyncdAt = props.dubicarssyncdAt ? new Date(props.dubicarssyncdAt as string) : null;
  }

  // ── Getters ───────────────────────────────────────────
  get id():                  string | null  { return this.#id;                  }
  get source():              CarSource      { return this.#source;              }
  get status():              CarStatus      { return this.#status;              }
  get dubicarsAdId():        number | null  { return this.#source.dubicarsAdId; }
  get make():                string         { return this.#make;                }
  get model():               string         { return this.#model;               }
  get year():                number         { return this.#year;                }
  get trim():                string | null  { return this.#trim;                }
  get price():               number         { return this.#price;               }
  get kmDriven():            number         { return this.#kmDriven;            }
  get color():               string | null  { return this.#color;               }
  get interiorColor():       string | null  { return this.#interiorColor;       }
  get bodyType():            string | null  { return this.#bodyType;            }
  get fuelType():            string | null  { return this.#fuelType;            }
  get transmission():        string | null  { return this.#transmission;        }
  get cylinders():           number | null  { return this.#cylinders;           }
  get driveType():           string | null  { return this.#driveType;           }
  get engineSize():          string | null  { return this.#engineSize;          }
  get seats():               number | null  { return this.#seats;               }
  get doors():               number | null  { return this.#doors;               }
  get horsePower():          number | null  { return this.#horsePower;          }
  get wheelSize():           string | null  { return this.#wheelSize;           }
  get mechanicalCondition(): string | null  { return this.#mechanicalCondition; }
  get bodyCondition():       string | null  { return this.#bodyCondition;       }
  get regionalSpecs():       string | null  { return this.#regionalSpecs;       }
  get exportStatus():        string | null  { return this.#exportStatus;        }
  get steeringSide():        'left'|'right' { return this.#steeringSide;        }
  get warranty():            boolean        { return this.#warranty;            }
  get warrantyMonths():      string | null  { return this.#warrantyMonths;      }
  get images():              string[]       { return [...this.#images];         }
  get features():            string[]       { return [...this.#features];       }
  get descriptionEn():       string | null  { return this.#descriptionEn;       }
  get descriptionAr():       string | null  { return this.#descriptionAr;       }
  get additionalInfoEn():    string | null  { return this.#additionalInfoEn;    }
  get additionalInfoAr():    string | null  { return this.#additionalInfoAr;    }
  get adReference():         string | null  { return this.#adReference;         }
  get createdAt():           Date           { return this.#createdAt;           }
  get updatedAt():           Date           { return this.#updatedAt;           }
  get dubicarssyncdAt():     Date | null    { return this.#dubicarssyncdAt;     }

  // ── Domain Methods ────────────────────────────────────

  activate(): Car {
    if (this.#status.isDeleted()) throw new Error('لا يمكن تفعيل سيارة محذوفة');
    return this.#copyWith({ status: CarStatus.active() });
  }

  pause(): Car {
    if (!this.#status.isActive()) throw new Error('يمكن إيقاف السيارات النشطة فقط');
    return this.#copyWith({ status: CarStatus.paused() });
  }

  markAsSold(): Car {
    if (this.#status.isDeleted()) throw new Error('لا يمكن تعليم سيارة محذوفة كمباعة');
    return this.#copyWith({ status: CarStatus.sold() });
  }

  markAsDeleted(): Car {
    return this.#copyWith({ status: CarStatus.deleted() });
  }

  update(changes: Partial<CarProps>): Car {
    if (this.#status.isDeleted()) throw new Error('لا يمكن تعديل سيارة محذوفة');
    return this.#copyWith({ ...changes, updatedAt: new Date() });
  }

  /** يُستدعى بعد كل Sync ناجح من دبي كار */
  recordSync(): Car {
    return this.#copyWith({ dubicarssyncdAt: new Date() });
  }

  /** يُستدعى أثناء Sync لتحديث بيانات وحالة السيارة القادمة من دبي كار */
  syncFromDubicars(changes: Partial<CarProps>, status: string | CarStatus): Car {
    const newStatus = status instanceof CarStatus ? status : CarStatus.from(status);
    return this.#copyWith({
      ...changes,
      status: newStatus,
      updatedAt: new Date(),
      dubicarssyncdAt: new Date(),
    });
  }

  isFromDubicars(): boolean { return this.#source.isDubicars(); }
  isLocal():        boolean { return this.#source.isLocal();    }

  // ── Serialization ─────────────────────────────────────

  toObject(): Required<CarProps> {
    return {
      id:                   this.#id,
      source:               this.#source.value,
      dubicarsAdId:         this.#source.dubicarsAdId,
      status:               this.#status.value,
      make:                 this.#make,
      model:                this.#model,
      year:                 this.#year,
      trim:                 this.#trim,
      price:                this.#price,
      kmDriven:             this.#kmDriven,
      color:                this.#color,
      interiorColor:        this.#interiorColor,
      bodyType:             this.#bodyType,
      fuelType:             this.#fuelType,
      transmission:         this.#transmission,
      cylinders:            this.#cylinders,
      driveType:            this.#driveType,
      engineSize:           this.#engineSize,
      seats:                this.#seats,
      doors:                this.#doors,
      horsePower:           this.#horsePower,
      wheelSize:            this.#wheelSize,
      mechanicalCondition:  this.#mechanicalCondition,
      bodyCondition:        this.#bodyCondition,
      regionalSpecs:        this.#regionalSpecs,
      exportStatus:         this.#exportStatus,
      steeringSide:         this.#steeringSide,
      warranty:             this.#warranty,
      warrantyMonths:       this.#warrantyMonths,
      images:               [...this.#images],
      features:             [...this.#features],
      descriptionEn:        this.#descriptionEn,
      descriptionAr:        this.#descriptionAr,
      additionalInfoEn:     this.#additionalInfoEn,
      additionalInfoAr:     this.#additionalInfoAr,
      adReference:          this.#adReference,
      createdAt:            this.#createdAt,
      updatedAt:            this.#updatedAt,
      dubicarssyncdAt:      this.#dubicarssyncdAt,
    };
  }

  // ── Private ───────────────────────────────────────────

  #validate(props: CarProps): void {
    const required = ['make', 'model', 'year', 'price'] as const;
    for (const f of required) {
      if (props[f] == null || props[f] === '')
        throw new Error(`الحقل "${f}" مطلوب`);
    }
    if (Number(props.year) < 1900 || Number(props.year) > 2100)
      throw new Error('سنة الصنع يجب أن تكون بين 1900 و 2100');
    const numPrice = Number(props.price);
    if (isNaN(numPrice) || numPrice < 0)
      throw new Error('السعر يجب أن يكون رقم موجب');
  }

  #copyWith(changes: Partial<CarProps>): Car {
    return new Car({ ...this.toObject(), ...changes });
  }
}