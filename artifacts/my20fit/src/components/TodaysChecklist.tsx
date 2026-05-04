import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";

interface Task {
  id: string;
  title: string;
  desc: string;
  tags: string[];
  done: boolean;
}

export default function TodaysChecklist() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "30-min cardio", desc: "based on your cholesterol", tags: ["HIGH", "30 MIN", "GYM"], done: true },
    { id: "2", title: "Hit fiber target", desc: "30g today", tags: ["HOME"], done: true },
    { id: "3", title: "10-min stretch", desc: "before bed", tags: ["10 MIN", "HOME"], done: true },
    { id: "4", title: "Skip fried food", desc: "recovery day", tags: ["MED"], done: false },
    { id: "5", title: "Sleep by 23:00", desc: "7h+ target", tags: ["HIGH"], done: false },
  ]);

  const [showConfetti, setShowConfetti] = useState(false);
  const doneCount = tasks.filter(t => t.done).length;
  const allDone = doneCount === tasks.length;

  useEffect(() => {
    if (allDone) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [allDone]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="mb-8 relative" data-testid="section-checklist">
      {showConfetti && <Confetti />}

      <div className="section-header">
        <h2>TODAY'S CHECKLIST</h2>
        <span style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: '12px', color: 'var(--muted)' }}>{dateStr}</span>
      </div>

      <motion.div
        className="app-card !p-0 mb-3 overflow-hidden"
        animate={{ backgroundColor: allDone ? '#16a34a' : 'var(--card)' }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-4 flex justify-between items-center">
          <div>
            <p
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '10px',
                letterSpacing: '3px',
                color: allDone ? 'rgba(255,255,255,0.7)' : 'var(--muted)',
              }}
            >
              TODAY
            </p>
            <p
              style={{
                fontFamily: "'Barlow Condensed', system-ui",
                fontWeight: 600,
                fontSize: '16px',
                color: allDone ? '#fff' : 'var(--text)',
              }}
            >
              {dateStr}
            </p>
          </div>
          <div className="text-right">
            <p
              className="leading-none"
              style={{ fontFamily: "'Orbitron', monospace", fontSize: '22px', fontWeight: 700, color: allDone ? '#fff' : 'var(--text)' }}
            >
              {doneCount}/{tasks.length}
            </p>
            <p
              className="mt-1"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '10px',
                letterSpacing: '2px',
                color: allDone ? 'rgba(255,255,255,0.85)' : 'var(--muted)',
              }}
            >
              {allDone ? 'ALL DONE TODAY!' : 'COMPLETE'}
            </p>
          </div>
        </div>
        <div className="h-1.5 w-full" style={{ backgroundColor: 'var(--card2)' }}>
          <motion.div
            className="h-full"
            style={{ backgroundColor: allDone ? 'rgba(255,255,255,0.35)' : '#22C55E' }}
            initial={{ width: 0 }}
            animate={{ width: `${(doneCount / tasks.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </motion.div>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout
            onClick={() => toggleTask(task.id)}
            className="app-card !p-3 flex items-center gap-3 cursor-pointer"
            style={{ opacity: task.done ? 0.6 : 1 }}
            data-testid={`task-${task.id}`}
            whileTap={{ scale: 0.98 }}
          >
            <div className="shrink-0 w-6 h-6 flex items-center justify-center">
              {task.done ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#22C55E' }}
                >
                  <Check size={13} strokeWidth={3} color="white" />
                </motion.div>
              ) : (
                <Circle size={24} strokeWidth={1.5} style={{ color: 'var(--border-subtle)' }} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="leading-tight truncate"
                style={{
                  fontFamily: "'Barlow Condensed', system-ui",
                  fontWeight: 600,
                  fontSize: '15px',
                  color: task.done ? 'var(--muted)' : 'var(--text)',
                  textDecoration: task.done ? 'line-through' : 'none',
                }}
              >
                {task.title}
              </p>
              <p
                className="truncate"
                style={{ fontFamily: "'Barlow Condensed', system-ui", fontSize: '12px', color: 'var(--muted)' }}
              >
                {task.desc}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-1 flex-wrap justify-end">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '10px',
                    letterSpacing: '1.5px',
                    color: 'var(--muted)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '3px',
                    padding: '1px 5px',
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
  const colors = ['#C41101', '#22C55E', '#3B82F6', '#D4A800', '#F97316', '#A855F7'];
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
            style={{ left: `${left}%`, backgroundColor: color, borderRadius: '2px' }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{ y: '100vh', opacity: 0, rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
            transition={{ duration, delay, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
