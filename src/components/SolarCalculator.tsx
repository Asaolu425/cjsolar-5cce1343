import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Sun, DollarSign, Zap, TrendingUp, Home, MapPin } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface CalcInputs {
  roofSize: number;
  electricBill: number;
  sunHours: number;
  panelEfficiency: number;
  state: string;
}

const stateIncentives: Record<string, number> = {
  CA: 0.30, TX: 0.26, FL: 0.26, AZ: 0.30, NY: 0.30,
  NV: 0.26, CO: 0.26, NC: 0.26, NJ: 0.30, MA: 0.30,
  other: 0.26,
};

export default function SolarCalculator() {
  const [inputs, setInputs] = useState<CalcInputs>({
    roofSize: 1500,
    electricBill: 200,
    sunHours: 5,
    panelEfficiency: 20,
    state: "CA",
  });

  const results = useMemo(() => {
    const panelArea = inputs.roofSize * 0.65; // usable roof area
    const panelWattage = 400; // watts per panel
    const panelSize = 18; // sq ft per panel
    const numPanels = Math.floor(panelArea / panelSize);
    const systemSizeKw = (numPanels * panelWattage) / 1000;
    const annualProductionKwh = systemSizeKw * inputs.sunHours * 365 * (inputs.panelEfficiency / 100);
    const costPerWatt = 2.77;
    const grossCost = systemSizeKw * 1000 * costPerWatt;
    const incentive = stateIncentives[inputs.state] || stateIncentives.other;
    const netCost = grossCost * (1 - incentive);
    const annualSavings = (annualProductionKwh * 0.14);
    const paybackYears = netCost / annualSavings;
    const roi25Year = (annualSavings * 25) - netCost;

    const chartData = Array.from({ length: 26 }, (_, i) => ({
      year: i,
      savings: Math.round(annualSavings * i),
      cost: Math.round(netCost),
      netSavings: Math.round(annualSavings * i - netCost),
    }));

    return { numPanels, systemSizeKw, annualProductionKwh, grossCost, netCost, annualSavings, paybackYears, roi25Year, incentive, chartData };
  }, [inputs]);

  const update = (key: keyof CalcInputs, value: number | string) =>
    setInputs((p) => ({ ...p, [key]: value }));

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-8"
      >
        <h2 className="font-display text-3xl font-bold text-foreground">
          Calculate Your <span className="text-primary">Solar Savings</span>
        </h2>
        <p className="mt-2 text-muted-foreground">
          Enter your details below to estimate costs, savings, and ROI for going solar.
        </p>
      </motion.div>

      {/* Input Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-6 sm:grid-cols-2"
      >
        <InputCard icon={<Home className="h-5 w-5" />} label="Roof Size" unit="sq ft" value={inputs.roofSize} min={500} max={5000} step={100} onChange={(v) => update("roofSize", v)} />
        <InputCard icon={<DollarSign className="h-5 w-5" />} label="Monthly Electric Bill" unit="$" value={inputs.electricBill} min={50} max={800} step={10} onChange={(v) => update("electricBill", v)} />
        <InputCard icon={<Sun className="h-5 w-5" />} label="Peak Sun Hours/Day" unit="hrs" value={inputs.sunHours} min={3} max={8} step={0.5} onChange={(v) => update("sunHours", v)} />
        <InputCard icon={<Zap className="h-5 w-5" />} label="Panel Efficiency" unit="%" value={inputs.panelEfficiency} min={15} max={23} step={1} onChange={(v) => update("panelEfficiency", v)} />
      </motion.div>

      {/* State Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card p-5"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <span className="font-medium text-foreground">Your State</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(stateIncentives).filter(s => s !== "other").map((s) => (
            <button
              key={s}
              onClick={() => update("state", s)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                inputs.state === s
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <ResultCard label="System Size" value={`${results.systemSizeKw.toFixed(1)} kW`} sub={`${results.numPanels} panels`} color="primary" />
        <ResultCard label="Net Cost" value={`$${Math.round(results.netCost).toLocaleString()}`} sub={`${Math.round(results.incentive * 100)}% incentive`} color="accent" />
        <ResultCard label="Annual Savings" value={`$${Math.round(results.annualSavings).toLocaleString()}`} sub={`${Math.round(results.annualProductionKwh).toLocaleString()} kWh/yr`} color="energy" />
        <ResultCard label="Payback Period" value={`${results.paybackYears.toFixed(1)} yrs`} sub={`$${Math.round(results.roi25Year).toLocaleString()} 25yr ROI`} color="solar" />
      </motion.div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Cumulative Savings Over 25 Years
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={results.chartData}>
            <defs>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160 60% 45%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(160 60% 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="year" stroke="hsl(220 10% 55%)" fontSize={12} tickLine={false} />
            <YAxis stroke="hsl(220 10% 55%)" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(220 18% 8%)", border: "1px solid hsl(220 15% 16%)", borderRadius: "8px", color: "hsl(45 10% 92%)" }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
            />
            <Area type="monotone" dataKey="savings" stroke="hsl(160 60% 45%)" fill="url(#savingsGrad)" strokeWidth={2} name="Total Savings" />
            <Area type="monotone" dataKey="cost" stroke="hsl(45 100% 50%)" fill="none" strokeWidth={2} strokeDasharray="5 5" name="System Cost" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

function InputCard({ icon, label, unit, value, min, max, step, onChange }: {
  icon: React.ReactNode; label: string; unit: string; value: number;
  min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
          <span className="text-primary">{icon}</span>
        </div>
        <span className="font-medium text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 accent-primary h-2 rounded-full bg-secondary appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <span className="min-w-[70px] text-right font-mono text-sm text-foreground">
          {unit === "$" ? `$${value}` : `${value} ${unit}`}
        </span>
      </div>
    </div>
  );
}

function ResultCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${color === "primary" ? "text-primary" : color === "accent" ? "text-accent" : color === "energy" ? "text-energy" : "text-solar"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </motion.div>
  );
}
