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
    <div className="min-h-screen w-full flex" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-1 w-full lg:pl-[220px]">
        <div className="max-w-[720px] mx-auto w-full px-4 md:px-6 lg:px-8 pb-6 pt-2 lg:pt-8 min-h-screen flex flex-col">
          <Header theme={theme} toggleTheme={toggleTheme} />

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex-1 w-full flex flex-col"
          >
            <motion.div variants={item}><Greeting /></motion.div>
            <motion.div variants={item}><WeatherCard /></motion.div>
            <motion.div variants={item}><MedicalCheckup /></motion.div>
            <motion.div variants={item}><TodaysChecklist /></motion.div>
            <motion.div variants={item}><QuickCheckin /></motion.div>
            <motion.div variants={item}><MyMoments /></motion.div>
            <motion.div variants={item}><SportsEvents /></motion.div>
            <motion.div variants={item}><PlusCard /></motion.div>
          </motion.div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
