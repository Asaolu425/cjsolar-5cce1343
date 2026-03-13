import { useState } from 'react';
import { Sun, Zap, Battery, LayoutGrid } from 'lucide-react';
import type { SolarInputs, SolarResults } from '../lib/solarCalculations';
import { calculateSolar } from '../lib/solarCalculations';

const defaults: SolarInputs = {
  dailyUsageKwh: 30,
  peakLoadW: 5000,
  peakSunHours: 5,
  backupHours: 10,
  systemVoltage: 48,
  batteryType: 'lithium',
  customerType: 'residential',
};

export default function SolarCalculator() {
  const [inputs, setInputs] = useState<SolarInputs>(defaults);
  const [results, setResults] = useState<SolarResults | null>(null);

  const update = (key: keyof SolarInputs, value: string | number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleCalculate = () => {
    setResults(calculateSolar(inputs));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4">
          <Sun className="w-10 h-10 text-primary" />
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
            CJ <span className="text-primary">Solar</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Professional hybrid solar system sizing calculator
        </p>
      </header>

      {/* Input Form */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <InputCard title="Energy Profile" icon={<Zap className="w-5 h-5 text-primary" />}>
          <Field label="Daily Usage (kWh)" value={inputs.dailyUsageKwh} onChange={v => update('dailyUsageKwh', +v)} />
          <Field label="Peak Load (W)" value={inputs.peakLoadW} onChange={v => update('peakLoadW', +v)} />
          <Field label="Peak Sun Hours" value={inputs.peakSunHours} onChange={v => update('peakSunHours', +v)} step={0.5} />
          <SelectField label="Customer Type" value={inputs.customerType} options={[['residential','Residential'],['commercial','Commercial']]} onChange={v => update('customerType', v)} />
        </InputCard>

        <InputCard title="System Config" icon={<Battery className="w-5 h-5 text-primary" />}>
          <SelectField label="System Voltage" value={String(inputs.systemVoltage)} options={[['12','12V'],['24','24V'],['48','48V']]} onChange={v => update('systemVoltage', +v as 12|24|48)} />
          <SelectField label="Battery Type" value={inputs.batteryType} options={[['lithium','Lithium-ion'],['lead-acid','Lead Acid'],['tubular','Tubular']]} onChange={v => update('batteryType', v)} />
          <Field label="Backup Hours" value={inputs.backupHours} onChange={v => update('backupHours', +v)} />
        </InputCard>
      </div>

      <div className="text-center mb-10">
        <button onClick={handleCalculate} className="px-8 py-3 bg-primary text-primary-foreground font-display font-semibold rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20 text-lg">
          Calculate System
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
          <ResultCard icon={<Zap className="w-6 h-6" />} label="Inverter" value={`${results.inverterKva} kVA`} sub={`${results.inverterW.toLocaleString()} W`} />
          <ResultCard icon={<Sun className="w-6 h-6" />} label="Solar Array" value={`${results.numberOfPanels} panels`} sub={`${(results.solarArrayW / 1000).toFixed(1)} kW`} />
          <ResultCard icon={<Battery className="w-6 h-6" />} label="Battery Bank" value={`${results.batteryUnits} units`} sub={`${results.batteryCapacityKwh} kWh`} />
          <ResultCard icon={<LayoutGrid className="w-6 h-6" />} label="Est. Cost" value={results.estimatedCost} sub="Components only" />
        </div>
      )}
    </div>
  );
}

function InputCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-5">
        {icon}
        <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: string) => void; step?: number }) {
  return (
    <label className="block">
      <span className="text-sm text-muted-foreground">{label}</span>
      <input type="number" value={value} step={step} onChange={e => onChange(e.target.value)}
        className="mt-1 w-full bg-secondary border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm text-muted-foreground">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="mt-1 w-full bg-secondary border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function ResultCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 text-center">
      <div className="text-primary mb-2 flex justify-center">{icon}</div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
