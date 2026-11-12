import { ApplianceCategory } from '../types/appliance';
import { Household } from '../types/household';
import { DEFAULT_TARIffS } from '../core/tariff-engine/default-tariffs';

export interface ApplianceReferenceItem {
  id: string;
  name: string;
  category: ApplianceCategory;
  typicalWatts: number;
  typicalStandbyWatts?: number;
  typicalHoursPerDay: number;
  typicalDaysPerMonth: number;
  dutyCycle?: number;
  isCycleBased?: boolean;
  typicalEnergyPerCycleKwh?: number;
  cyclesPerMonth?: number;
  note: string;
}

export const APPLIANCE_CATALOG: ApplianceReferenceItem[] = [
  // Climatización
  {
    id: 'cat-ac-12000',
    name: 'Aire Acondicionado 12.000 BTU (Convencional)',
    category: 'climatizacion',
    typicalWatts: 1200,
    typicalStandbyWatts: 3,
    typicalHoursPerDay: 4,
    typicalDaysPerMonth: 30,
    dutyCycle: 0.75,
    note: 'Referencia estimada. Verifique la potencia real del fabricante y etiqueta SEER.',
  },
  {
    id: 'cat-ac-inverter',
    name: 'Aire Acondicionado Inverter 12.000 BTU',
    category: 'climatizacion',
    typicalWatts: 750,
    typicalStandbyWatts: 2,
    typicalHoursPerDay: 4,
    typicalDaysPerMonth: 30,
    dutyCycle: 0.6,
    note: 'Referencia estimada. Mayor eficiencia por modulación del compresor.',
  },
  {
    id: 'cat-fan-standing',
    name: 'Ventilador de pedestal o torre',
    category: 'climatizacion',
    typicalWatts: 55,
    typicalStandbyWatts: 0,
    typicalHoursPerDay: 8,
    typicalDaysPerMonth: 30,
    dutyCycle: 1.0,
    note: 'Referencia estimada. Varía entre 40W (baja velocidad) y 70W (alta).',
  },
  {
    id: 'cat-dehumidifier',
    name: 'Deshumidificador doméstico',
    category: 'climatizacion',
    typicalWatts: 320,
    typicalStandbyWatts: 1,
    typicalHoursPerDay: 6,
    typicalDaysPerMonth: 30,
    dutyCycle: 0.8,
    note: 'Referencia estimada. Equipamiento frecuente en climas húmedos tropicales.',
  },
  // Cocina
  {
    id: 'cat-fridge-frost-free',
    name: 'Refrigerador / Nevera No Frost (300-400 L)',
    category: 'cocina',
    typicalWatts: 180,
    typicalStandbyWatts: 0,
    typicalHoursPerDay: 24,
    typicalDaysPerMonth: 30,
    dutyCycle: 0.35, // compressor runs ~35% of the time
    note: 'Referencia estimada. Factor de trabajo cíclico promedio de 35%.',
  },
  {
    id: 'cat-fridge-inverter',
    name: 'Refrigerador Inverter eficiente',
    category: 'cocina',
    typicalWatts: 110,
    typicalStandbyWatts: 0,
    typicalHoursPerDay: 24,
    typicalDaysPerMonth: 30,
    dutyCycle: 0.45,
    note: 'Referencia estimada. Compresor de velocidad variable.',
  },
  {
    id: 'cat-microwave',
    name: 'Horno microondas',
    category: 'cocina',
    typicalWatts: 1200,
    typicalStandbyWatts: 3,
    typicalHoursPerDay: 0.3, // ~18 minutes daily
    typicalDaysPerMonth: 30,
    dutyCycle: 1.0,
    note: 'Referencia estimada. Potencia eléctrica de entrada (superior a la potencia de cocción útil).',
  },
  {
    id: 'cat-electric-stove',
    name: 'Cocina eléctrica (2 discos activos)',
    category: 'cocina',
    typicalWatts: 2500,
    typicalStandbyWatts: 0,
    typicalHoursPerDay: 1.2,
    typicalDaysPerMonth: 30,
    dutyCycle: 0.7,
    note: 'Referencia estimada. Termostatos activan y desactivan resistencias.',
  },
  {
    id: 'cat-air-fryer',
    name: 'Freidora de aire (Air Fryer)',
    category: 'cocina',
    typicalWatts: 1500,
    typicalStandbyWatts: 1,
    typicalHoursPerDay: 0.5,
    typicalDaysPerMonth: 25,
    dutyCycle: 0.85,
    note: 'Referencia estimada. Uso aproximado 30 minutos por sesión.',
  },
  {
    id: 'cat-coffee-maker',
    name: 'Cafetera eléctrica de goteo',
    category: 'cocina',
    typicalWatts: 800,
    typicalStandbyWatts: 0,
    typicalHoursPerDay: 0.4,
    typicalDaysPerMonth: 30,
    dutyCycle: 1.0,
    note: 'Referencia estimada. Preparación y mantenimiento de calor.',
  },
  // Lavandería
  {
    id: 'cat-washer',
    name: 'Lavadora automática (agua fría)',
    category: 'lavanderia',
    isCycleBased: true,
    typicalEnergyPerCycleKwh: 0.45,
    cyclesPerMonth: 16, // ~4 washings/week
    typicalWatts: 450,
    typicalHoursPerDay: 0.8,
    typicalDaysPerMonth: 16,
    note: 'Referencia estimada. Consumo en ciclo de agua fría (sin calentamiento interno).',
  },
  {
    id: 'cat-dryer',
    name: 'Secadora eléctrica de ropa',
    category: 'lavanderia',
    isCycleBased: true,
    typicalEnergyPerCycleKwh: 2.8,
    cyclesPerMonth: 12,
    typicalWatts: 2800,
    typicalHoursPerDay: 1.0,
    typicalDaysPerMonth: 12,
    note: 'Referencia estimada. Resistencia térmica de alta potencia.',
  },
  {
    id: 'cat-iron',
    name: 'Plancha eléctrica de vapor',
    category: 'lavanderia',
    typicalWatts: 1400,
    typicalStandbyWatts: 0,
    typicalHoursPerDay: 1.0,
    typicalDaysPerMonth: 8,
    dutyCycle: 0.65,
    note: 'Referencia estimada. Termostato bimetálico modula el calor.',
  },
  // Agua caliente
  {
    id: 'cat-shower-head',
    name: 'Ducha eléctrica instantánea (termoducha)',
    category: 'agua_caliente',
    typicalWatts: 4500,
    typicalStandbyWatts: 0,
    typicalHoursPerDay: 0.4, // ~24 min total household daily
    typicalDaysPerMonth: 30,
    dutyCycle: 1.0,
    note: 'Referencia estimada. Aparato de potencia crítica instantánea muy extendido en Costa Rica.',
  },
  {
    id: 'cat-water-heater-tank',
    name: 'Calentador de agua de tanque (30 gal)',
    category: 'agua_caliente',
    typicalWatts: 3000,
    typicalStandbyWatts: 0,
    typicalHoursPerDay: 2.5,
    typicalDaysPerMonth: 30,
    dutyCycle: 0.6,
    note: 'Referencia estimada. Depende de las pérdidas estáticas del aislamiento térmico.',
  },
  // Entretenimiento e Informática
  {
    id: 'cat-tv-led',
    name: 'Televisor Smart TV 55" LED',
    category: 'entretenimiento',
    typicalWatts: 95,
    typicalStandbyWatts: 1.5,
    typicalHoursPerDay: 5,
    typicalDaysPerMonth: 30,
    dutyCycle: 1.0,
    note: 'Referencia estimada. Varía según brillo de pantalla y modo HDR.',
  },
  {
    id: 'cat-pc-desktop',
    name: 'Ordenador de escritorio para trabajo',
    category: 'informatica',
    typicalWatts: 150,
    typicalStandbyWatts: 4,
    typicalHoursPerDay: 6,
    typicalDaysPerMonth: 22,
    dutyCycle: 1.0,
    note: 'Referencia estimada incluyendo monitor LCD.',
  },
  {
    id: 'cat-laptop',
    name: 'Portátil / Laptop eficiente',
    category: 'informatica',
    typicalWatts: 45,
    typicalStandbyWatts: 1,
    typicalHoursPerDay: 7,
    typicalDaysPerMonth: 25,
    dutyCycle: 1.0,
    note: 'Referencia estimada cargador promedio.',
  },
  {
    id: 'cat-wifi-router',
    name: 'Router Wi-Fi / Módem de fibra óptica',
    category: 'informatica',
    typicalWatts: 12,
    typicalStandbyWatts: 0,
    typicalHoursPerDay: 24,
    typicalDaysPerMonth: 30,
    dutyCycle: 1.0,
    note: 'Referencia estimada. Funciona de manera continua 24/7 (8.6 kWh/mes).',
  },
  // Iluminación
  {
    id: 'cat-led-bulbs',
    name: 'Juego de bombillas LED para vivienda (10 focos 9W)',
    category: 'iluminacion',
    typicalWatts: 90,
    typicalStandbyWatts: 0,
    typicalHoursPerDay: 5,
    typicalDaysPerMonth: 30,
    dutyCycle: 1.0,
    note: 'Referencia estimada para 10 bombillas LED de 9W (equivalentes a 600W incandescentes).',
  },
];

export interface GlossaryItem {
  id: string;
  term: string;
  symbol?: string;
  unit?: string;
  definitionSimple: string;
  definitionTechnical: string;
  formula?: string;
  numericalExample: string;
  practicalTip: string;
}

export const ENERGY_GLOSSARY: GlossaryItem[] = [
  {
    id: 'glos-potencia',
    term: 'Potencia Eléctrica',
    symbol: 'P',
    unit: 'Vatio (W) o Kilovatio (kW)',
    definitionSimple: 'La velocidad con la que un aparato consume electricidad en un instante dado.',
    definitionTechnical: 'Rapidez de transferencia de energía por unidad de tiempo. En corriente alterna monofásica: P = V × I × cos(φ).',
    formula: 'P = E / t  o  P = V × I',
    numericalExample: 'Una plancha de 1.500 W demanda el triple de flujo de energía instantáneo que una bombilla de 500 W.',
    practicalTip: 'Aparatos que calientan mediante resistencias (duchas, secadoras, hornos) siempre tienen potencias muy elevadas (1.500 a 5.000 W).',
  },
  {
    id: 'glos-energia',
    term: 'Energía Eléctrica',
    symbol: 'E',
    unit: 'Kilovatio-hora (kWh)',
    definitionSimple: 'La cantidad total de electricidad consumida durante un tiempo determinado. Esto es exactamente lo que cobra la factura.',
    definitionTechnical: 'Integral de la potencia en el intervalo de tiempo: E = ∫ P(t) dt. Un kWh equivale a 3.600.000 julios.',
    formula: 'E (kWh) = [P (W) × t (horas)] / 1.000',
    numericalExample: 'Un aparato de 1.000 W encendido durante 2 horas consume 2 kWh.',
    practicalTip: 'El costo depende tanto de la potencia como de las horas. Un aparato de poca potencia encendido 24h al día puede consumir más que uno potente encendido 5 minutos.',
  },
  {
    id: 'glos-tension',
    term: 'Tensión / Voltaje',
    symbol: 'V',
    unit: 'Voltio (V)',
    definitionSimple: 'La fuerza o presión que empuja a los electrones a través del cable.',
    definitionTechnical: 'Diferencia de potencial eléctrico entre dos puntos, equivalente a la energía por unidad de carga (J/C).',
    formula: 'V = I × R',
    numericalExample: 'En Costa Rica el suministro residencial habitual es de 120 V fase-neutro y 240 V bifásico entre fases.',
    practicalTip: 'Aparatos de alta potencia como cocinas o secadoras se conectan a 240 V para reducir la corriente y las pérdidas de calor en el cableado.',
  },
  {
    id: 'glos-corriente',
    term: 'Corriente / Intensidad',
    symbol: 'I',
    unit: 'Amperio (A)',
    definitionSimple: 'La cantidad de electrones que fluyen por el cable cada segundo.',
    definitionTechnical: 'Tasa de flujo de carga eléctrica Q a través de una superficie transversal: I = dQ / dt.',
    formula: 'I = P / (V × cos φ)',
    numericalExample: 'Una ducha de 4.800 W a 120 V exige una corriente de 40 A, requiriendo un disyuntor y cables calibre 8 AWG como mínimo.',
    practicalTip: 'Si los disyuntores de tu caja de térmicos se disparan frecuentemente, se está superando la capacidad segura de amperios del circuito.',
  },
  {
    id: 'glos-tarifa-progresiva',
    term: 'Tarifa por Bloques Progresivos',
    symbol: 'T-PROG',
    unit: '₡/kWh o $/kWh por bloque',
    definitionSimple: 'Sistema tarifario donde el precio por cada kWh aumenta a medida que consumes más en el mes.',
    definitionTechnical: 'Estructura marginal decreciente en subsidio: los primeros kWh subsidiados (p. ej. 0-200 kWh) tienen una tarifa económica; el consumo excedente se factura a un costo superior.',
    formula: 'Costo = ∑ (kWh_bloque_i × Precio_bloque_i)',
    numericalExample: 'En tarifa ICE T-RE, los primeros 200 kWh cuestan ₡68.25 cada uno; a partir del kWh 201 cada uno cuesta ₡121.40 (casi el doble).',
    practicalTip: 'Si tu hogar consume 220 kWh, ahorrar apenas 20 kWh reduce el consumo en el bloque más caro, logrando un ahorro económico desproporcionadamente alto.',
  },
  {
    id: 'glos-standby',
    term: 'Consumo en Espera (Vampiro)',
    symbol: 'P_espera',
    unit: 'Vatio (W)',
    definitionSimple: 'La electricidad que consumen los aparatos cuando están apagados pero continúan enchufados.',
    definitionTechnical: 'Energía consumida en modo de reposo por fuentes conmutadas, pantallas LED, receptores infrarrojos y tarjetas Wi-Fi.',
    formula: 'E_vampiro = (P_standby × 24 × 30) / 1.000',
    numericalExample: 'Una consola en reposo (15 W) consume 10.8 kWh al mes sin que nadie juegue con ella.',
    practicalTip: 'Utiliza regletas multicontacto con interruptor para desconectar televisores, consolas y equipos de sonido durante la noche.',
  },
  {
    id: 'glos-ciclo-trabajo',
    term: 'Factor de Trabajo (Duty Cycle)',
    symbol: 'DC',
    unit: 'Porcentaje (%) o Factor (0 a 1)',
    definitionSimple: 'La porción del tiempo durante la cual un aparato con compresor o termostato está realmente encendido.',
    definitionTechnical: 'Relación entre la duración del pulso activo y el periodo total: DC = t_on / (t_on + t_off).',
    formula: 'E = (P × 24h × 30d × DC) / 1.000',
    numericalExample: 'Un refrigerador de 200 W no funciona 24 horas continuas; su compresor arranca alrededor del 35% del tiempo (DC = 0.35), consumiendo 50.4 kWh al mes.',
    practicalTip: 'Si los empaques de la puerta del refrigerador están dañados, el compresor trabajará hasta un 60% del tiempo, disparando el consumo.',
  },
];

export const INITIAL_HOUSEHOLD_CR: Household = {
  id: 'household-primary',
  name: 'Mi Hogar Principal',
  country: 'Costa Rica',
  region: 'San José',
  city: 'San José',
  distributor: 'ICE',
  currency: 'CRC',
  currencySymbol: '₡',
  currencyDecimals: 0,
  timezone: 'America/Costa_Rica',
  installationType: 'home',
  occupants: 3,
  areaSquareMeters: 110,
  constructionType: 'Concreto',
  usageCategory: 'residential',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
