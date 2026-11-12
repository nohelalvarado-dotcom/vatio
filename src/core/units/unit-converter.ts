/**
 * Conversion of electrical and energy units with full dimensional validity.
 */

export function wattsToKilowatts(watts: number): number {
  if (watts < 0) throw new Error('La potencia no puede ser negativa');
  return watts / 1000;
}

export function kilowattsToWatts(kilowatts: number): number {
  if (kilowatts < 0) throw new Error('La potencia no puede ser negativa');
  return kilowatts * 1000;
}

export function wattHoursToKilowattHours(wh: number): number {
  if (wh < 0) throw new Error('La energía no puede ser negativa');
  return wh / 1000;
}

export function kilowattHoursToWattHours(kwh: number): number {
  if (kwh < 0) throw new Error('La energía no puede ser negativa');
  return kwh * 1000;
}

export function megawattHoursToKilowattHours(mwh: number): number {
  if (mwh < 0) throw new Error('La energía no puede ser negativa');
  return mwh * 1000;
}

export function kilowattHoursToMegawattHours(kwh: number): number {
  if (kwh < 0) throw new Error('La energía no puede ser negativa');
  return kwh / 1000;
}

/**
 * Energy from Power (Watts) and Time (hours)
 * Formula: E (kWh) = (P (W) * t (hours)) / 1000
 */
export function calculateEnergyKwhFromPower(powerWatts: number, hours: number, units: number = 1): number {
  if (powerWatts < 0 || hours < 0 || units < 0) {
    throw new Error('Los parámetros de potencia, tiempo y unidades no pueden ser negativos');
  }
  return Number(((powerWatts * hours * units) / 1000).toFixed(4));
}

/**
 * Power (Watts) from Energy (kWh) and Time (hours)
 * Formula: P (W) = (E (kWh) * 1000) / t (hours)
 */
export function calculatePowerWattsFromEnergy(energyKwh: number, hours: number): number {
  if (energyKwh < 0 || hours <= 0) {
    throw new Error('Parámetros no válidos para cálculo de potencia (horas debe ser > 0)');
  }
  return Number(((energyKwh * 1000) / hours).toFixed(2));
}

/**
 * Hours of use from Energy (kWh) and Power (Watts)
 * Formula: t (hours) = (E (kWh) * 1000) / P (W)
 */
export function calculateHoursFromEnergyAndPower(energyKwh: number, powerWatts: number): number {
  if (energyKwh < 0 || powerWatts <= 0) {
    throw new Error('Parámetros no válidos para cálculo de tiempo (potencia debe ser > 0)');
  }
  return Number(((energyKwh * 1000) / powerWatts).toFixed(2));
}
