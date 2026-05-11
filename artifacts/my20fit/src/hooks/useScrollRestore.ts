import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

export function useScrollRestore() {
  const [location] = useLocation();
  const scrollPositions = useRef<Record<string, number>>({});

  useEffect(() => {
    const handleScroll = () => {
      scrollPositions.current[location] = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location]);

  useEffect(() => {
    const saved = scrollPositions.current[location] || 0;
    const t = setTimeout(() => {
      window.scrollTo({ top: saved, behavior: "instant" as ScrollBehavior });
    }, 50);
    return () => clearTimeout(t);
  }, [location]);
}
