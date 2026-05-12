import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface Task {
  id: string;
  title: string;
  desc: string;
  tags: string[];
  done: boolean;
  icon?: string;
}

interface McuChecklist {
  icon?: string;
  title: string;
  reason?: string;
  priority?: string;
  duration?: number | null;
  location?: string | null;
}

const DEFAULT_TASKS: Task[] = [
  { id: "1", title: "30-min cardio", desc: "based on your cholesterol", tags: ["HIGH", "30 MIN", "GYM"], done: false },
  { id: "2", title: "Hit fiber target", desc: "30g today", tags: ["HOME"], done: false },
  { id: "3", title: "10-min stretch", desc: "before bed", tags: ["10 MIN", "HOME"], done: false },
  { id: "4", title: "Skip fried food", desc: "recovery day", tags: ["MED"], done: false },
  { id: "5", title: "Sleep by 23:00", desc: "7h+ target", tags: ["HIGH"], done: false },
];

function mcuChecklistToTasks(items: McuChecklist[]): Task[] {
  return items.map((item, i) => {
    const tags: string[] = [];
    if (item.priority) tags.push(item.priority.toUpperCase());
    if (item.duration) tags.push(`${item.duration} MIN`);
    if (item.location && item.location !== "null") tags.push(item.location.toUpperCase());
    return {
      id: String(i + 1),
      title: item.title,
      desc: item.reason ?? "",
      tags,
      done: false, // always start unchecked
      icon: item.icon,
    };
  });
}

function loadChecklist(): Task[] {
  try {
    const saved = localStorage.getItem("my20fit_mcu_result");
    if (saved) {
      const data = JSON.parse(saved);
      if (Array.isArray(data.checklist) && data.checklist.length > 0) {
        return data.checklist.map((item: McuChecklist, i: number) => {
          const tags: string[] = [];
          if (item.priority) tags.push(item.priority.toUpperCase());
          if (item.duration) tags.push(`${item.duration} MIN`);
          if (item.location && item.location !== "null") tags.push(item.location.toUpperCase());
          return {
            id: String(i + 1),
            title: item.title,
            desc: item.reason ?? "",
            tags,
            done: false, // always start unchecked
            icon: item.icon,
          };
        });
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_TASKS;
}

const todayISO = () => new Date().toISOString().split("T")[0];

export default function TodaysChecklist() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(loadChecklist);
  const [isMcuPersonalized, setIsMcuPersonalized] = useState(() => {
    try {
      const saved = localStorage.getItem("my20fit_mcu_result");
      if (saved) {
        const data = JSON.parse(saved);
        return Array.isArray(data.checklist) && data.checklist.length > 0;
      }
    } catch { /* ignore */ }
    return false;
  });
  const [showConfetti, setShowConfetti] = useState(false);

  // Daily reset logic
  useEffect(() => {
    const today = todayISO();
    const savedDate = localStorage.getItem("my20fit_checklist_date");

    if (savedDate !== today) {
      // New day — reset all to unchecked and save today's date
      localStorage.setItem("my20fit_checklist_date", today);
      localStorage.removeItem("my20fit_checklist_states");
      setTasks(prev => prev.map(item => ({ ...item, done: false })));
    } else {
      // Same day — restore saved check states
      try {
        const savedStates = localStorage.getItem("my20fit_checklist_states");
        if (savedStates) {
          const states: boolean[] = JSON.parse(savedStates);
          setTasks(prev => prev.map((item, i) => ({ ...item, done: states[i] ?? false })));
        }
      } catch { /* ignore */ }
    }
  }, []);

  // Listen for mcu-analyzed event (new MCU uploaded → replace tasks, reset states)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail?.checklist) && detail.checklist.length > 0) {
        const newTasks = mcuChecklistToTasks(detail.checklist);
        setTasks(newTasks);
        setIsMcuPersonalized(true);
        localStorage.removeItem("my20fit_checklist_states");
        localStorage.setItem("my20fit_checklist_date", todayISO());
      }
    };
    window.addEventListener("mcu-analyzed", handler);
    return () => window.removeEventListener("mcu-analyzed", handler);
  }, []);

  const doneCount = tasks.filter(t => t.done).length;
  const allDone = tasks.length > 0 && doneCount === tasks.length;

  useEffect(() => {
    if (allDone) {
      setShowConfetti(true);
      showToast("Semua checklist hari ini selesai! 🎉");
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [allDone, showToast]);

  const toggleTask = (id: string) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, done: !t.done } : t);
      // Persist check states for the current day
      localStorage.setItem(
        "my20fit_checklist_states",
        JSON.stringify(updated.map(t => t.done))
      );
      return updated;
    });
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="mb-8 relative" data-testid="section-checklist">
      {showConfetti && <Confetti />}

      <div className="section-header">
        <div className="flex items-center gap-2">
          <h2>TODAY'S CHECKLIST</h2>
          {isMcuPersonalized && (
            <span
              className="px-2 py-0.5 rounded"
              style={{
                backgroundColor: "rgba(34,197,94,0.12)",
                color: "#22C55E",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: "9px",
                letterSpacing: "1px",
              }}
            >
              FROM YOUR MCU
            </span>
          )}
        </div>
        <div className="section-header-line" />
        <span className="section-header-right">{dateStr}</span>
      </div>

      {/* Header card */}
      <div
        className="!p-0 mb-3 overflow-hidden"
        style={{
          borderRadius: 16,
          position: "relative",
          background: allDone
            ? "linear-gradient(135deg, #14532D, #166534)"
            : "linear-gradient(135deg, #0A0908 0%, #161410 100%)",
          transition: "background 0.5s ease",
        }}
      >
        <div className="p-4 flex justify-between items-center">
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "10px", letterSpacing: "1.5px", color: "rgba(255,255,255,0.45)" }}>
              TODAY
            </p>
            <p style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: "15px", color: "#fff" }}>
              {dateStr}
            </p>
          </div>
          <div className="text-right">
            <p className="leading-none" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "22px", fontWeight: 700, color: "#fff" }}>
              {doneCount}/{tasks.length}
            </p>
            <p className="mt-1" style={{ fontFamily: allDone ? "'Anton', sans-serif" : "'Barlow Condensed', sans-serif", fontWeight: allDone ? 400 : 900, fontSize: "10px", letterSpacing: "1.5px", color: "rgba(255,255,255,0.55)" }}>
              {allDone ? "ALL DONE TODAY!" : "COMPLETE"}
            </p>
          </div>
        </div>
        <div style={{ height: 3, width: "100%", background: "rgba(255,255,255,.08)" }}>
          <motion.div
            style={{ height: "100%", backgroundColor: allDone ? "rgba(255,255,255,0.5)" : "#C41101" }}
            initial={{ width: 0 }}
            animate={{ width: `${tasks.length ? (doneCount / tasks.length) * 100 : 0}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Task items */}
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout
            onClick={() => toggleTask(task.id)}
            className="app-card !p-3 flex items-center gap-3 cursor-pointer"
            style={{ opacity: task.done ? 0.58 : 1, borderLeft: `3px solid ${task.done ? "#22C55E" : "var(--red)"}` }}
            data-testid={`task-${task.id}`}
            whileTap={{ scale: 0.98 }}
          >
            <div className="shrink-0 w-6 h-6 flex items-center justify-center">
              {task.done ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 18 }}
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#22C55E" }}
                >
                  <Check size={13} strokeWidth={3} color="white" />
                </motion.div>
              ) : (
                <Circle size={24} strokeWidth={1.5} style={{ color: "var(--border-subtle)" }} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {task.icon && <span className="mr-1">{task.icon}</span>}
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900,
                  fontSize: "15px",
                  color: task.done ? "var(--muted)" : "var(--text)",
                  textDecoration: task.done ? "line-through" : "none",
                }}
              >
                {task.title}
              </span>
              {task.desc && (
                <p
                  className="truncate"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontStyle: "italic", fontSize: "12px", color: "var(--muted)" }}
                >
                  {task.desc}
                </p>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-1 flex-wrap justify-end">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
                    fontSize: "10px",
                    letterSpacing: "1px",
                    color: "var(--muted)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "3px",
                    padding: "1px 5px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ["#C41101", "#22C55E", "#3B82F6", "#D4A800", "#F97316", "#A855F7"];
  const particles = Array.from({ length: 60 });
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((_, i) => {
        const left = Math.random() * 100;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const delay = Math.random() * 0.5;
        const duration = 1.2 + Math.random() * 2;
        return (
          <motion.div
            key={i}
            className="absolute top-0 w-2 h-2"
            style={{ left: `${left}%`, backgroundColor: color, borderRadius: "2px" }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{ y: "100vh", opacity: 0, rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
            transition={{ duration, delay, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
