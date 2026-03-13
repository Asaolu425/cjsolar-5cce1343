import { Toaster } from 'sonner';
import SolarCalculator from './components/SolarCalculator';
import AICopilot from './components/AICopilot';

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" theme="dark" />
      <SolarCalculator />
      <AICopilot />
    </div>
  );
}
