import { Check } from "lucide-react";

export default function PlusCard() {
  return (
    <div className="mb-20 lg:mb-8" data-testid="section-upsell">
      <div className="app-card !bg-[#131313] !border-[#1F1F1F] text-white !p-6 relative overflow-hidden" style={{ boxShadow: 'none' }}>
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-[var(--gold)]/10 rounded-full blur-2xl"></div>
        
        <div className="inline-flex items-center gap-1.5 bg-[#1F1F1F] px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-[var(--gold)] mb-4">
          <span>⭐</span> 20FIT PLUS
        </div>

        <h3 className="font-display text-3xl tracking-wide mb-1">START SMART. SAVE 10%.</h3>
        <p className="text-sm text-[#A0A0A0] font-medium mb-6">New here? Plus pays for itself after 2 sessions.</p>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <div className="bg-[#1A1A1A] p-2.5 rounded-lg text-xs font-bold text-center">10% Arena</div>
          <div className="bg-[#1A1A1A] p-2.5 rounded-lg text-xs font-bold text-center">10% Clinic</div>
          <div className="bg-[#1A1A1A] p-2.5 rounded-lg text-xs font-bold text-center">10% PT</div>
          <div className="bg-[#1A1A1A] p-2.5 rounded-lg text-xs font-bold text-center">10% Shop</div>
        </div>

        <div className="flex flex-col gap-2.5 mb-6 text-sm text-[#F0F0F0] font-medium">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-[var(--gold)] shrink-0" strokeWidth={3} />
            <p>Priority class booking</p>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-[var(--gold)] shrink-0" strokeWidth={3} />
            <p>Free body composition scans</p>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-[var(--gold)] shrink-0" strokeWidth={3} />
            <p>1 guest pass per month</p>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-[var(--gold)] shrink-0" strokeWidth={3} />
            <p>Exclusive merch access</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#1F1F1F]">
          <div>
            <p className="text-xs text-[#A0A0A0] font-bold uppercase tracking-wider mb-0.5">PRICE</p>
            <p className="font-bold text-lg">Rp 49.000<span className="text-sm text-[#A0A0A0] font-medium">/mo</span></p>
          </div>
          <button className="bg-[var(--gold)] text-black font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-widest hover:bg-white transition-colors" data-testid="button-upgrade-plus">
            UPGRADE →
          </button>
        </div>
      </div>
    </div>
  );
}
