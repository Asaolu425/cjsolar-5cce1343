export interface SolarInputs {
  dailyUsageKwh: number;
  peakLoadW: number;
  peakSunHours: number;
  backupHours: number;
  systemVoltage: 12 | 24 | 48;
  batteryType: 'lithium' | 'lead-acid' | 'tubular';
  customerType: 'residential' | 'commercial';
}

export interface SolarResults {
  inverterW: number;
  inverterKva: number;
  solarArrayW: number;
  numberOfPanels: number;
  batteryCapacityAh: number;
  batteryCapacityKwh: number;
  batteryUnits: number;
  estimatedCost: string;
}

const PANEL_WATT = 550;
const BATTERY_AH = 200; // per unit at nominal voltage

export function calculateSolar(inputs: SolarInputs): SolarResults {
  const { dailyUsageKwh, peakLoadW, peakSunHours, systemVoltage, batteryType, backupHours } = inputs;

  // Inverter sizing: peak load / 0.8 + 1500W headroom
  const inverterW = Math.ceil((peakLoadW / 0.8) + 1500);
  const inverterKva = parseFloat((inverterW / (0.8 * 1000)).toFixed(1));

  // Solar array: daily Wh * 1.3 (losses) / peak sun hours
  const dailyWh = dailyUsageKwh * 1000;
  const solarArrayW = Math.ceil((dailyWh * 1.3) / peakSunHours);
  const numberOfPanels = Math.ceil(solarArrayW / PANEL_WATT);

  // Battery sizing
  const dod = batteryType === 'lithium' ? 0.9 : 0.5;
  const backupWh = (dailyWh / 24) * backupHours;
  const batteryCapacityAh = Math.ceil(backupWh / (systemVoltage * dod));
  const batteryCapacityKwh = parseFloat(((batteryCapacityAh * systemVoltage) / 1000).toFixed(1));
  const batteryUnits = Math.ceil(batteryCapacityAh / BATTERY_AH);

  // Rough cost estimate (USD)
  const panelCost = numberOfPanels * 180;
  const batteryCost = batteryUnits * (batteryType === 'lithium' ? 350 : 150);
  const inverterCost = inverterKva * 200;
  const totalCost = panelCost + batteryCost + inverterCost;
  const estimatedCost = totalCost.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return { inverterW, inverterKva, solarArrayW, numberOfPanels, batteryCapacityAh, batteryCapacityKwh, batteryUnits, estimatedCost };
}
