import { Tariff, TariffCalculationResult, TariffTier } from '../../types/tariff';
import { roundPrecision } from '../calculations/energy-math';

/**
 * Calculates electricity cost for a given consumption in kWh based on a full Tariff definition.
 * Transparently tracks tiers, fixed charges, additional charges, and taxes with exact step explanations.
 */
export function calculateTariffCost(tariff: Tariff, consumptionKwh: number): TariffCalculationResult {
  const kwh = Math.max(0, consumptionKwh);
  const steps: string[] = [];
  let energyCost = 0;
  const tierDetails: Array<{ tierName: string; kwhInTier: number; rate: number; subtotal: number }> = [];

  const { fixedCharge = 0, tiers = [], flatRate = 0, additionalConcepts = [] } = tariff.components;

  steps.push(`Tarifa: ${tariff.name} (${tariff.distributor}) | Método: ${tariff.calculationMethod}`);
  steps.push(`Consumo total: ${kwh} ${tariff.energyUnit}`);

  // 1. Calculate Energy Cost
  if (tariff.calculationMethod === 'flat') {
    energyCost = roundPrecision(kwh * flatRate, 2);
    steps.push(`Energía plana: ${kwh} kWh × ${flatRate} ${tariff.currency}/kWh = ${energyCost} ${tariff.currency}`);
  } else if (tariff.calculationMethod === 'tiered_marginal') {
    // Marginal tiered billing: each tier consumes up to its limit
    let remainingKwh = kwh;
    steps.push(`Cálculo de bloques progresivos marginales:`);

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      if (remainingKwh <= 0 && i > 0) break;

      const tierCapacity = tier.toKwh !== null ? (tier.toKwh - tier.fromKwh) : Infinity;
      const kwhInThisTier = Math.min(remainingKwh, tierCapacity);

      if (kwhInThisTier > 0 || (i === 0 && kwh === 0)) {
        const subtotal = roundPrecision(kwhInThisTier * tier.pricePerKwh, 2);
        energyCost += subtotal;
        remainingKwh -= kwhInThisTier;

        tierDetails.push({
          tierName: tier.name,
          kwhInTier: kwhInThisTier,
          rate: tier.pricePerKwh,
          subtotal,
        });

        steps.push(`  • ${tier.name} (${tier.fromKwh} - ${tier.toKwh ?? '∞'} kWh): ${kwhInThisTier} kWh × ${tier.pricePerKwh} = ${subtotal} ${tariff.currency}`);
      }
    }
    energyCost = roundPrecision(energyCost, 2);
    steps.push(`Subtotal Energía: ${energyCost} ${tariff.currency}`);
  } else if (tariff.calculationMethod === 'tiered_integral') {
    // Integral tiered billing: the tier matching the total kwh defines the single rate for all kwh
    const selectedTier = tiers.find(t => kwh >= t.fromKwh && (t.toKwh === null || kwh <= t.toKwh)) || tiers[tiers.length - 1];
    const rate = selectedTier ? selectedTier.pricePerKwh : flatRate;
    energyCost = roundPrecision(kwh * rate, 2);

    tierDetails.push({
      tierName: selectedTier ? selectedTier.name : 'Bloque seleccionado',
      kwhInTier: kwh,
      rate,
      subtotal: energyCost,
    });

    steps.push(`Bloque integral: Consumo de ${kwh} kWh cae en bloque "${selectedTier?.name || 'Tarifa'}":`);
    steps.push(`  ${kwh} kWh × ${rate} = ${energyCost} ${tariff.currency}`);
  } else {
    // Default fallback to flat rate if provided
    energyCost = roundPrecision(kwh * flatRate, 2);
    steps.push(`Energía: ${kwh} kWh × ${flatRate} = ${energyCost} ${tariff.currency}`);
  }

  // 2. Fixed Charge
  const roundedFixedCharge = roundPrecision(fixedCharge, 2);
  if (roundedFixedCharge > 0) {
    steps.push(`Cargo fijo mensual: ${roundedFixedCharge} ${tariff.currency}`);
  }

  // 3. Additional Charges (excluding taxes)
  const additionalChargesBreakdown: Array<{ name: string; amount: number; description: string }> = [];
  let totalAdditionalCharges = 0;

  for (const concept of additionalConcepts.filter(c => !c.isTax)) {
    let amount = 0;
    let desc = '';

    if (concept.conceptType === 'percentage') {
      let base = 0;
      if (concept.appliedTo === 'energy_subtotal') base = energyCost;
      else if (concept.appliedTo === 'fixed_charge') base = roundedFixedCharge;
      else if (concept.appliedTo === 'accumulated_subtotal') base = energyCost + roundedFixedCharge + totalAdditionalCharges;
      amount = roundPrecision((base * concept.rate) / 100, 2);
      desc = `${concept.rate}% sobre ${concept.appliedTo} (${base} ${tariff.currency})`;
    } else if (concept.conceptType === 'per_kwh') {
      amount = roundPrecision(kwh * concept.rate, 2);
      desc = `${kwh} kWh × ${concept.rate} ${tariff.currency}/kWh`;
    } else if (concept.conceptType === 'fixed_charge') {
      amount = roundPrecision(concept.rate, 2);
      desc = `Monto fijo: ${concept.rate} ${tariff.currency}`;
    }

    if (amount > 0) {
      additionalChargesBreakdown.push({
        name: concept.name,
        amount,
        description: desc,
      });
      totalAdditionalCharges += amount;
      steps.push(`Cargo adicional [${concept.name}]: ${amount} ${tariff.currency} (${desc})`);
    }
  }
  totalAdditionalCharges = roundPrecision(totalAdditionalCharges, 2);

  // 4. Taxes
  // Special Costa Rica VAT rule: In Costa Rica (Ley 9635), residential electricity is exempt up to 280 kWh/month.
  // Over 280 kWh/month, 13% VAT applies to the entire electricity invoice.
  const taxesBreakdown: Array<{ name: string; amount: number; description: string }> = [];
  let totalTaxes = 0;

  const currentSubtotal = energyCost + roundedFixedCharge + totalAdditionalCharges;

  for (const tax of additionalConcepts.filter(c => c.isTax)) {
    let taxAmount = 0;
    let desc = '';

    // Check Costa Rica 280 kWh threshold if note or identifier specifies IVA Residencial
    const isCostaRicaResidentialVat = tax.name.toLowerCase().includes('iva') && tariff.customerCategory === 'residential' && tariff.country === 'Costa Rica';

    if (isCostaRicaResidentialVat && kwh <= 280) {
      desc = `Exento de IVA por consumo menor o igual a 280 kWh (Ley 9635 Art. 8)`;
      taxesBreakdown.push({
        name: `${tax.name} (Exento)`,
        amount: 0,
        description: desc,
      });
      steps.push(`Impuesto [${tax.name}]: 0 ${tariff.currency} (${desc})`);
      continue;
    }

    if (tax.conceptType === 'percentage') {
      let base = currentSubtotal;
      if (tax.appliedTo === 'energy_subtotal') base = energyCost;
      taxAmount = roundPrecision((base * tax.rate) / 100, 2);
      desc = `${tax.rate}% sobre subtotal (${base} ${tariff.currency})`;
    }

    if (taxAmount > 0) {
      taxesBreakdown.push({
        name: tax.name,
        amount: taxAmount,
        description: desc,
      });
      totalTaxes += taxAmount;
      steps.push(`Impuesto [${tax.name}]: ${taxAmount} ${tariff.currency} (${desc})`);
    }
  }
  totalTaxes = roundPrecision(totalTaxes, 2);

  // 5. Total and Effective Price
  const totalCalculated = roundPrecision(energyCost + roundedFixedCharge + totalAdditionalCharges + totalTaxes, 2);
  const effectiveAveragePricePerKwh = kwh > 0 ? roundPrecision(totalCalculated / kwh, 2) : 0;

  steps.push(`Total Calculado: ${totalCalculated} ${tariff.currency}`);
  steps.push(`Precio efectivo promedio: ${effectiveAveragePricePerKwh} ${tariff.currency}/kWh`);

  return {
    energyCost,
    fixedCharge: roundedFixedCharge,
    additionalChargesBreakdown,
    totalAdditionalCharges,
    taxesBreakdown,
    totalTaxes,
    totalCalculated,
    effectiveAveragePricePerKwh,
    tierDetails,
    formulaSteps: steps,
  };
}
