import { motion } from "framer-motion";
import Header from "@/components/Header";
import Greeting from "@/components/Greeting";
import WeatherCard from "@/components/WeatherCard";
import MedicalCheckup from "@/components/MedicalCheckup";
import TodaysChecklist from "@/components/TodaysChecklist";
import QuickCheckin from "@/components/QuickCheckin";
import MyMoments from "@/components/MyMoments";
import SportsEvents from "@/components/SportsEvents";
import PlusCard from "@/components/PlusCard";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 26 } },
};

export default function Dashboard({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  return (
    <div
      className="min-h-screen w-full flex"
      style={{
        background: `
          radial-gradient(circle at 20% 10%, rgba(196,17,1,0.08) 0%, transparent 40%),
          var(--bg)
        `,
        color: 'var(--text)',
      }}
    >
      {/* Top fade overlay */}
      <div className="top-fade-overlay" />

      <Sidebar theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-1 w-full lg:pl-[220px]">
        <div className="max-w-[720px] mx-auto w-full px-4 md:px-6 lg:px-8 pb-8 pt-2 lg:pt-8 min-h-screen flex flex-col">
          <Header theme={theme} toggleTheme={toggleTheme} />

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex-1 w-full flex flex-col gap-1"
          >
            <motion.div variants={item} className="mb-2"><Greeting /></motion.div>
            <motion.div variants={item} className="mb-5"><WeatherCard /></motion.div>
            <motion.div variants={item} className="mb-5"><MedicalCheckup /></motion.div>
            <motion.div variants={item} className="mb-5"><TodaysChecklist /></motion.div>
            <motion.div variants={item} className="mb-5"><QuickCheckin /></motion.div>
            <motion.div variants={item} className="mb-5"><MyMoments /></motion.div>
            <motion.div variants={item} className="mb-5"><SportsEvents /></motion.div>
            <motion.div variants={item} className="mb-5"><PlusCard /></motion.div>
          </motion.div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
