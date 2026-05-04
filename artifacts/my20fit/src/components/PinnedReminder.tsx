import { Pin } from "lucide-react";

export default function PinnedReminder() {
  return (
    <div className="app-card !p-3 mb-6 relative overflow-hidden" data-testid="card-pinned-reminder">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--red)]" />
      <div className="flex items-start gap-3 pl-2">
        <Pin className="text-[var(--red)] mt-0.5 shrink-0" size={16} />
        <p className="text-sm font-medium leading-tight">
          <span className="font-bold">First-week checklist:</span> upload MCU, scan your face, book first session.
        </p>
      </div>
    </div>
  );
}
