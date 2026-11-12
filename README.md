# VATIO — Plataforma Inteligente de Análisis y Optimización Energética

> «Comprende tu energía. Controla tu consumo. Reduce tus gastos».

VATIO es una aplicación de software completa, funcional y profesional para el análisis, diagnóstico matemático, control y optimización del consumo eléctrico residencial y comercial.

---

## 1. Principios Fundamentales
* **Rigor matemático:** Cada cálculo cuenta con una fórmula identificable, entradas explícitas y resultados reproducibles.
* **Transparencia radical:** Botón «¿Cómo se calculó?» disponible en cada métrica clave con sustitución de variables y supuestos.
* **Privacidad desde el diseño:** Persistencia 100% local en IndexedDB en el dispositivo del usuario. Sin servidores ni telemetría invasiva.
* **Independencia:** Funciona sin conexión a Internet y sin depender de APIs de pago.
* **Arquitectura Android / Capacitor:** Preparada para empaquetarse en APK con ergonomía táctil inferior.

---

## 2. Requisitos y Ejecución Local

### Requisitos:
* Node.js v18+ o v20+
* NPM / PNPM

### Comandos de desarrollo:
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en puerto 3000
npm run dev

# Ejecutar pruebas unitarias matemáticas deterministas (node:test)
npx --yes tsx --test src/core/calculations/energy-math.test.ts

# Compilar para producción (Vite SPA)
npm run build
```

---

## 3. Estructura del Proyecto

```text
vatio/
├── src/
│   ├── app/
│   │   └── App.tsx                      # Orquestador principal y gestión de estado
│   ├── components/
│   │   ├── layout/                      # Header, Sidebar, BottomNav
│   │   ├── charts/                      # EnergyBarChart, CategoryDonutChart (SVG interactivos)
│   │   └── ui/                          # Modal, OriginBadge, FormulaDialog
│   ├── core/
│   │   ├── calculations/                # Fórmulas de electrodomésticos, amortización y pruebas
│   │   ├── tariff-engine/               # Motor de bloques progresivos, cargos fijos y pliegos
│   │   ├── forecasting/                 # Pronósticos estadísticos por regresión lineal y promedios
│   │   ├── diagnostics/                 # Detección matemática de anomalías y picos
│   │   ├── validators/                  # Auditoría de lecturas y sumas de conceptos
│   │   └── units/                       # Conversor dimensional W, kW, Wh, kWh
│   ├── database/
│   │   ├── db.ts                        # Abstracción IndexedDB con transacciones seguras
│   │   ├── schema.ts                    # Tiendas de objetos
│   │   ├── seed.ts                      # Catálogo de referencia, glosario didáctico
│   │   └── sample-data.ts               # Conjunto de datos de prueba para demostración
│   ├── modules/
│   │   ├── onboarding/                  # Asistente inicial de 5 pasos
│   │   ├── dashboard/                   # Mi Energía: gastos, consumos, evolución
│   │   ├── invoices/                    # Centro de facturas, auditoría, comparación
│   │   ├── appliances/                  # Inventario, ciclo de trabajo, comparación A/B
│   │   ├── simulator/                   # Laboratorio: hábitos, reemplazo y curva de sensibilidad
│   │   ├── diagnostics/                 # Anomalías e intervalo de confianza del próximo recibo
│   │   ├── savings/                     # Plan de ahorro priorizado e inversiones con retorno
│   │   ├── tariffs/                     # Pliegos oficiales ARESEP y calculadora
│   │   ├── tools/                       # Calculadora eléctrica, conversor y glosario
│   │   ├── reports/                     # Informe imprimible en PDF y respaldo AES-GCM
│   │   └── settings/                    # Configuración de instalación y tema
│   └── types/                           # Definiciones TypeScript de entidades
├── capacitor.config.ts                  # Puente hacia Android
└── README.md
```

---

## 4. Guía de Extensibilidad

### Cómo añadir una nueva distribuidora o tarifa
1. Abrir `src/core/tariff-engine/default-tariffs.ts`.
2. Crear un nuevo objeto conforme a la interfaz `Tariff`:
   - Definir `distributor` (ej. "ESPH", "CFE", "Enel").
   - Especificar `calculationMethod`: `'tiered_marginal'` (bloques escalonados), `'tiered_integral'` o `'flat'`.
   - Especificar los bloques en `tiers` con `fromKwh`, `toKwh` y `pricePerKwh`.
   - Añadir cargos fijos o tributos en `additionalConcepts`.
3. Guardar el archivo; el motor calculará automáticamente los desgloses sin tocar la interfaz.

### Cómo añadir un nuevo país
1. En `src/modules/onboarding/OnboardingWizard.tsx`, añadir el país a la lista `distributorsByCountry`.
2. Configurar el código de moneda y símbolo por defecto.
3. Registrar las tarifas oficiales del país en `src/core/tariff-engine/default-tariffs.ts`.

### Pasos para completar la integración nativa Android con Capacitor y Google ML Kit OCR
1. Generar proyecto Android nativo:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap add android
   npx cap sync
   ```
2. Instalar el plugin nativo de OCR para Google ML Kit:
   ```bash
   npm install @capacitor-mlkit/text-recognition
   ```
3. En `src/services/ocr/ocr-service.ts`:
   - Sustituir la implementación `WebOcrService` por un adaptador que invoque `TextRecognition.recognizeText({ imagePath })`.
   - Extraer con expresiones regulares los campos candidatos de la factura (periodo, kWh, total, lectura).
   - El resto de la aplicación (validación, auditoría matemática y desglose) ya está 100% desacoplado y listo para recibir los datos detectados.
