import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle } from "lucide-react";

interface Task {
  id: string;
  title: string;
  desc: string;
  tags: string;
  done: boolean;
}

export default function TodaysChecklist() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "30-min cardio", desc: "based on your cholesterol", tags: "HIGH · 30 MIN · GYM", done: true },
    { id: "2", title: "Hit fiber target", desc: "30g today", tags: "HOME", done: true },
    { id: "3", title: "10-min stretch", desc: "before bed", tags: "10 MIN · HOME", done: true },
    { id: "4", title: "Skip fried food", desc: "recovery day", tags: "MED", done: false },
    { id: "5", title: "Sleep by 23:00", desc: "7h+ target", tags: "HIGH", done: false }
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

  return (
    <div className="mb-8 relative" data-testid="section-checklist">
      {showConfetti && <Confetti />}
      
      <div className="section-header">
        <h2>TODAY'S CHECKLIST</h2>
      </div>

      <div className={`app-card !p-0 mb-3 overflow-hidden transition-colors duration-500 ${allDone ? 'bg-[var(--green)] text-white border-[var(--green)]' : ''}`}>
        <div className="p-4 flex justify-between items-center">
          <div>
            <p className={`text-xs font-bold ${allDone ? 'text-white/80' : 'text-[var(--text-soft)]'}`}>TODAY</p>
            <p className="font-bold">Mon 4 May</p>
          </div>
          <div className="text-right">
            <p className="font-mono-numbers text-xl font-bold leading-none">{doneCount}/{tasks.length}</p>
            <p className={`text-[10px] font-bold tracking-wider mt-1 ${allDone ? 'text-white' : 'text-[var(--text-soft)]'}`}>
              {allDone ? 'ALL DONE TODAY!' : 'COMPLETE'}
            </p>
          </div>
        </div>
        <div className="h-1.5 w-full bg-[var(--card2)] relative">
          <motion.div 
            className={`absolute left-0 top-0 bottom-0 ${allDone ? 'bg-white/40' : 'bg-[var(--green)]'}`}
            initial={{ width: 0 }}
            animate={{ width: `${(doneCount / tasks.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <motion.div 
            key={task.id}
            layout
            onClick={() => toggleTask(task.id)}
            className={`app-card !p-3 flex items-center gap-3 cursor-pointer ${task.done ? 'opacity-60' : ''}`}
            data-testid={`task-${task.id}`}
            whileHover={{ scale: 0.99 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="shrink-0 relative w-6 h-6 flex items-center justify-center">
              {task.done ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-[var(--green)] flex items-center justify-center text-white"
                >
                  <Check size={14} strokeWidth={3} />
                </motion.div>
              ) : (
                <Circle size={24} className="text-[var(--border-subtle)]" strokeWidth={2} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm leading-tight truncate ${task.done ? 'line-through text-[var(--muted)]' : ''}`}>
                {task.title}
              </p>
              <p className="text-xs text-[var(--muted)] truncate">{task.desc}</p>
            </div>
            <div className="shrink-0 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase bg-[var(--card2)] px-2 py-1 rounded">
              {task.tags}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ['#C41101', '#22C55E', '#3B82F6', '#FFD700', '#F97316', '#A855F7'];
  const particles = Array.from({ length: 60 });
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((_, i) => {
        const left = Math.random() * 100;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const delay = Math.random() * 0.5;
        const duration = 1 + Math.random() * 2;
        
        return (
          <motion.div
            key={i}
            className="absolute top-0 w-2 h-2 rounded-sm"
            style={{ left: `${left}%`, backgroundColor: color }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{ 
              y: '100vh', 
              opacity: 0,
              rotate: 360 * (Math.random() > 0.5 ? 1 : -1) 
            }}
            transition={{ 
              duration, 
              delay, 
              ease: "easeOut" 
            }}
          />
        );
      })}
    </div>
  );
}
