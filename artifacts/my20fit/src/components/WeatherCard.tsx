import { motion } from "framer-motion";

export default function WeatherCard() {
  return (
    <div className="app-card mb-8 flex items-stretch" data-testid="card-weather">
      <div className="flex-1 pr-4">
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-xs font-bold text-[var(--text-soft)] uppercase tracking-wider mb-1">Jakarta</p>
            <p className="text-sm text-[var(--text-soft)]">Hazy</p>
          </div>
          <div className="text-right">
            <span className="font-mono-numbers text-4xl leading-none font-bold">31°</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-xs font-medium text-[var(--muted)]">
          <div className="flex justify-between"><span>Feels like</span> <span className="text-[var(--text)]">34°</span></div>
          <div className="flex justify-between"><span>Humidity</span> <span className="text-[var(--text)]">72%</span></div>
          <div className="flex justify-between"><span>UV Index</span> <span className="text-[var(--text)]">8</span></div>
          <div className="flex justify-between"><span>Wind</span> <span className="text-[var(--text)]">6 km/h</span></div>
        </div>
      </div>
      <div className="w-24 bg-[#1A1A1A] rounded-xl flex flex-col items-center justify-center p-3 text-center shrink-0">
        <span className="text-[#A0A0A0] text-[10px] font-bold uppercase tracking-widest mb-1">AQI</span>
        <span className="font-mono-numbers text-2xl font-bold text-[#FFD700]">78</span>
        <span className="text-[#FFD700] text-[10px] font-bold mt-1 uppercase">Moderate</span>
      </div>
    </div>
  );
}
