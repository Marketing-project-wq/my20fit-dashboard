import { useLocation } from "wouter";

interface TabSwitcherProps {
  active: "login" | "register";
}

export default function TabSwitcher({ active }: TabSwitcherProps) {
  const [, setLocation] = useLocation();

  return (
    <div
      style={{
        display: "flex",
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid #E5E1D8",
        background: "#F5F1E8",
        marginBottom: 24,
      }}
    >
      <button
        onClick={() => setLocation("/login")}
        style={{
          flex: 1,
          padding: "11px 16px",
          fontFamily: "'Anton', sans-serif",
          fontWeight: 400,
          fontSize: 13,
          letterSpacing: "1px",
          cursor: "pointer",
          border: "none",
          transition: "all 0.2s",
          backgroundColor: active === "login" ? "#0A0908" : "transparent",
          color: active === "login" ? "#fff" : "#6E665C",
        }}
      >
        SIGN IN
      </button>
      <button
        onClick={() => setLocation("/register")}
        style={{
          flex: 1,
          padding: "11px 16px",
          fontFamily: "'Anton', sans-serif",
          fontWeight: 400,
          fontSize: 13,
          letterSpacing: "1px",
          cursor: "pointer",
          border: "none",
          transition: "all 0.2s",
          backgroundColor: active === "register" ? "#0A0908" : "transparent",
          color: active === "register" ? "#fff" : "#6E665C",
        }}
      >
        JOIN FREE
      </button>
    </div>
  );
}
