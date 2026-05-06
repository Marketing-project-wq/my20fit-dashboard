import { useState, useEffect } from "react";
import { Dumbbell, CloudRain, CloudLightning, Wind, Thermometer, PersonStanding } from "lucide-react";

interface HourlyItem {
  time: string;
  icon: string;
  temp: number;
  aqi: number | null;
}

interface WeatherData {
  city: string;
  condition: string;
  conditionCode: number;
  temp: number;
  feels: number;
  humidity: number;
  uv: number;
  wind: number;
  pm25: number;
  aqi: number;
  aqiLabel: string;
  isDay: boolean;
  hourly: HourlyItem[];
  fetchedAt: number;
}

const CACHE_KEY = "my20fit_weather_cache";
const CACHE_TTL = 30 * 60 * 1000;

function pm25ToAqi(pm25: number): number {
  const bp: [number, number, number, number][] = [
    [0, 12, 0, 50], [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150], [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300], [250.5, 500.4, 301, 500],
  ];
  for (const [cL, cH, iL, iH] of bp)
    if (pm25 >= cL && pm25 <= cH)
      return Math.round(((iH - iL) / (cH - cL)) * (pm25 - cL) + iL);
  return 500;
}

function getAqiLabel(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

function aqiNumColor(aqi: number): string {
  if (aqi <= 50) return "#22C55E";
  if (aqi <= 100) return "#EAB308";
  if (aqi <= 150) return "#F97316";
  if (aqi <= 200) return "#EF4444";
  return "#DC2626";
}

function weatherIcon(code: number, isDay: boolean): string {
  if (code === 1000) return isDay ? "☀️" : "🌙";
  if (code === 1003) return isDay ? "⛅" : "☁️";
  if ([1006, 1009].includes(code)) return "☁️";
  if ([1030, 1135, 1147].includes(code)) return "🌫️";
  if ([1063, 1150, 1153, 1180, 1183, 1240].includes(code)) return "🌦️";
  if ([1186, 1189, 1192, 1195, 1243, 1246].includes(code)) return "🌧️";
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return "⛈️";
  return isDay ? "⛅" : "☁️";
}

function getRecommendation(aqi: number, conditionCode: number, feelsLike: number) {
  const isRain = [1063,1150,1153,1180,1183,1186,1189,1192,1195,1240,1243,1246].includes(conditionCode);
  const isThunder = [1087,1273,1276,1279,1282].includes(conditionCode);
  const isHot = feelsLike > 38;
  const isBadAir = aqi > 100;

  if (isThunder) return {
    type: "indoor",
    icon: <CloudLightning size={20} color="#B91C1C" />,
    tag: "REKOMENDASI HARI INI",
    title: "Latihan Indoor Lebih Baik",
    desc: "Petir terdeteksi. Sangat berbahaya untuk aktivitas outdoor.",
    pills: ["THUNDER ALERT", `AQI ${aqi}`],
  };
  if (isBadAir && isRain) return {
    type: "indoor",
    icon: <Dumbbell size={20} color="#B91C1C" />,
    tag: "REKOMENDASI HARI INI",
    title: "Latihan Indoor Lebih Baik",
    desc: "Kualitas udara buruk ditambah hujan. Hindari olahraga outdoor hari ini.",
    pills: [`AQI ${aqi} ${getAqiLabel(aqi).toUpperCase()}`, "HUJAN DERAS"],
  };
  if (isBadAir) return {
    type: "indoor",
    icon: <Wind size={20} color="#B91C1C" />,
    tag: "KUALITAS UDARA BURUK",
    title: "Disarankan Indoor",
    desc: `AQI ${aqi} — paparan PM2.5 tinggi berbahaya untuk paru-paru saat olahraga.`,
    pills: [`AQI ${aqi}`, getAqiLabel(aqi).toUpperCase(), "BATASI OUTDOOR"],
  };
  if (isRain) return {
    type: "indoor",
    icon: <CloudRain size={20} color="#B91C1C" />,
    tag: "CUACA TIDAK MENDUKUNG",
    title: "Pertimbangkan Indoor",
    desc: "Hujan saat ini. Olahraga outdoor mungkin tidak nyaman.",
    pills: ["SEDANG HUJAN", `AQI ${aqi} OK`],
  };
  if (isHot) return {
    type: "indoor",
    icon: <Thermometer size={20} color="#B91C1C" />,
    tag: "SUHU TERLALU TINGGI",
    title: "Waspadai Heat Exhaustion",
    desc: `Feels like ${feelsLike}° — risiko heat stroke tinggi. Pilih indoor atau olahraga pagi/malam.`,
    pills: [`FEELS ${feelsLike}°`, "HEAT RISK"],
  };
  return {
    type: "outdoor",
    icon: <PersonStanding size={20} color="#15803D" />,
    tag: "KONDISI MENDUKUNG",
    title: "Oke untuk Outdoor!",
    desc: `AQI ${aqi} dan cuaca cerah. Waktu yang baik untuk lari atau olahraga outdoor.`,
    pills: [`AQI ${aqi} ${getAqiLabel(aqi).toUpperCase()}`, "CUACA BAIK"],
  };
}

function extractHourly(forecastDays: { hour: { time: string; condition: { code: number }; is_day: number; temp_c: number; air_quality?: { pm2_5?: number } }[] }[], count = 12): HourlyItem[] {
  const allHours = forecastDays.flatMap(d => d.hour);
  const hourBucket = Math.floor(Date.now() / 3600000) * 3600000;
  return allHours
    .filter(h => new Date(h.time.replace(" ", "T")).getTime() >= hourBucket)
    .slice(0, count)
    .map(h => {
      const t = new Date(h.time.replace(" ", "T"));
      const hr = t.getHours();
      const aqiVal = h.air_quality?.pm2_5 != null ? pm25ToAqi(h.air_quality.pm2_5) : null;
      return {
        time: hr === 0 ? "12AM" : hr < 12 ? `${hr}AM` : hr === 12 ? "12PM" : `${hr - 12}PM`,
        icon: weatherIcon(h.condition.code, h.is_day === 1),
        temp: Math.round(h.temp_c),
        aqi: aqiVal,
      };
    });
}

async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
  if (!apiKey) throw new Error("No API key");
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=2&aqi=yes&alerts=no`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WeatherAPI ${res.status}`);
  const data = await res.json();

  const c = data.current;
  const pm25 = c.air_quality?.pm2_5 ?? 0;
  const aqi = pm25ToAqi(pm25);

  return {
    city: data.location.name,
    condition: c.condition.text,
    conditionCode: c.condition.code,
    temp: Math.round(c.temp_c),
    feels: Math.round(c.feelslike_c),
    humidity: c.humidity,
    uv: c.uv,
    wind: Math.round(c.wind_kph),
    pm25: Math.round(pm25 * 10) / 10,
    aqi,
    aqiLabel: getAqiLabel(aqi),
    isDay: c.is_day === 1,
    hourly: extractHourly(data.forecast.forecastday),
    fetchedAt: Date.now(),
  };
}

// Pulse animation injected once
const pulseStyle = `
@keyframes wc-pulse{0%,100%{opacity:.35}50%{opacity:.75}}
.wc-shimmer{animation:wc-pulse 1.4s ease-in-out infinite;background:var(--card2);border-radius:6px}
`;

function Shimmer({ w, h, style = {} }: { w: number | string; h: number | string; style?: React.CSSProperties }) {
  return <div className="wc-shimmer" style={{ width: w, height: h, ...style }} />;
}

function UvText(uv: number): string {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  return "Very High";
}

const currentHourLabel = (() => {
  const h = new Date().getHours();
  return h === 0 ? "12AM" : h < 12 ? `${h}AM` : h === 12 ? "12PM" : `${h - 12}PM`;
})();

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Inject pulse keyframes once
    if (!document.getElementById("wc-pulse-style")) {
      const tag = document.createElement("style");
      tag.id = "wc-pulse-style";
      tag.textContent = pulseStyle;
      document.head.appendChild(tag);
    }

    // Check cache — invalidate if missing hourly (old format)
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, timestamp } = JSON.parse(raw);
        if (Date.now() - timestamp < CACHE_TTL && Array.isArray(data?.hourly)) {
          setWeather(data);
          setLoading(false);
          return;
        }
      }
    } catch { /* ignore */ }
    localStorage.removeItem(CACHE_KEY);

    const load = async (lat: number, lon: number) => {
      try {
        const data = await fetchWeatherData(lat, lon);
        setWeather(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    navigator.geolocation.getCurrentPosition(
      pos => load(pos.coords.latitude, pos.coords.longitude),
      () => load(-6.2088, 106.8456),
    );
  }, []);

  const card: React.CSSProperties = {
    backgroundColor: "var(--card)",
    borderRadius: "16px",
    boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
    overflow: "hidden",
    marginBottom: "24px",
  };

  const divider: React.CSSProperties = {
    borderTop: "1px solid var(--border-subtle)",
  };

  const muted = { color: "var(--muted)" } as const;
  const text = { color: "var(--text)" } as const;

  const rec = weather ? getRecommendation(weather.aqi, weather.conditionCode, weather.feels) : null;
  const isIndoor = rec?.type === "indoor";

  const recBg = isIndoor ? "#FEF2F2" : "#F0FDF4";
  const recBorder = isIndoor ? "#FECACA" : "#BBF7D0";
  const recIconBg = isIndoor ? "#FEE2E2" : "#DCFCE7";
  const recTagColor = isIndoor ? "#B91C1C" : "#15803D";
  const recPillBg = isIndoor ? "#FEE2E2" : "#DCFCE7";

  const minAgo = weather ? Math.floor((Date.now() - weather.fetchedAt) / 60000) : 0;

  return (
    <div style={card} data-testid="card-weather">

      {/* ── Section 1: Current ── */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(196,17,1,0.12) 0%, transparent 50%)", pointerEvents: "none" }} />
      <div style={{ padding: "20px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", position: "relative" }}>
        <div style={{ flex: 1 }}>
          {/* Location row */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#C41101", flexShrink: 0 }} />
            {loading ? (
              <Shimmer w={100} h={10} />
            ) : (
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "11px", letterSpacing: "2.5px", ...muted }}>
                {error ? "LOCATION · NOW" : `${weather?.city?.toUpperCase()} · NOW`}
              </span>
            )}
          </div>

          {/* Temp */}
          {loading ? (
            <Shimmer w={140} h={56} style={{ marginBottom: "6px" }} />
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", lineHeight: 1, marginBottom: "4px" }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "64px", fontWeight: 900, letterSpacing: "-2px", ...text }}>
                {error ? "—" : weather?.temp}
              </span>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "28px", fontWeight: 700, marginTop: "8px", ...muted }}>°</span>
            </div>
          )}

          {/* Condition */}
          {loading ? (
            <Shimmer w={90} h={13} style={{ marginBottom: "4px" }} />
          ) : (
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", fontWeight: 500, ...muted, marginBottom: "2px" }}>
              {error ? "—" : `${weatherIcon(weather?.conditionCode ?? 1000, weather?.isDay ?? true)} ${weather?.condition}`}
            </p>
          )}

          {/* Feels like */}
          {loading ? (
            <Shimmer w={70} h={11} />
          ) : (
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", color: "var(--muted)", opacity: 0.7 }}>
              {error ? "" : `Feels like ${weather?.feels}°`}
            </p>
          )}
        </div>

        {/* AQI Box */}
        <div style={{
          background: "linear-gradient(180deg, #111111 0%, #000000 100%)",
          boxShadow: "inset 0 0 20px rgba(196,17,1,0.2), 0 10px 30px rgba(0,0,0,0.25)",
          borderRadius: "12px",
          padding: "14px 16px",
          textAlign: "center",
          minWidth: "80px",
          flexShrink: 0,
        }}>
          <span style={{ display: "block", fontFamily: "'Bebas Neue', sans-serif", fontSize: "9px", letterSpacing: "2px", color: "rgba(255,255,255,.45)", marginBottom: "4px" }}>AQI</span>
          {loading ? (
            <>
              <Shimmer w={44} h={32} style={{ margin: "0 auto 6px" }} />
              <Shimmer w={56} h={10} style={{ margin: "0 auto" }} />
            </>
          ) : (
            <>
              <span style={{ display: "block", fontFamily: "'Orbitron', monospace", fontSize: "32px", fontWeight: 900, color: error ? "#666" : aqiNumColor(weather?.aqi ?? 0), lineHeight: 1 }}>
                {error ? "—" : weather?.aqi}
              </span>
              <span style={{ display: "block", fontFamily: "'Bebas Neue', sans-serif", fontSize: "10px", letterSpacing: "1.5px", color: error ? "#666" : aqiNumColor(weather?.aqi ?? 0), marginTop: "6px", lineHeight: 1.2 }}>
                {error ? "N/A" : weather?.aqiLabel?.toUpperCase()}
              </span>
            </>
          )}
        </div>
      </div>
      </div>

      {/* ── Section 2: Stats Grid ── */}
      <div style={{ ...divider, display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          { label: "HUMIDITY", val: loading ? null : error ? "—" : `${weather?.humidity}`, unit: "%" },
          { label: "UV INDEX", val: loading ? null : error ? "—" : `${weather?.uv}`, unit: error ? "" : UvText(weather?.uv ?? 0) },
          { label: "WIND", val: loading ? null : error ? "—" : `${weather?.wind}`, unit: "km/h" },
          { label: "PM2.5", val: loading ? null : error ? "—" : `${weather?.pm25}`, unit: "μg/m³" },
        ].map((s, i, arr) => (
          <div
            key={s.label}
            style={{
              padding: "12px 0",
              textAlign: "center",
              borderRight: i < arr.length - 1 ? "1px solid var(--border-subtle)" : "none",
            }}
          >
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "9px", letterSpacing: "2px", ...muted, marginBottom: "4px" }}>{s.label}</p>
            {loading ? (
              <Shimmer w={36} h={18} style={{ margin: "0 auto 3px" }} />
            ) : (
              <p style={{ fontFamily: "'Orbitron', monospace", fontSize: "16px", fontWeight: 700, ...text, lineHeight: 1 }}>{s.val}</p>
            )}
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", ...muted, marginTop: "2px" }}>{s.unit}</p>
          </div>
        ))}
      </div>

      {/* ── Section 3: Recommendation Banner ── */}
      {!loading && !error && rec && (
        <div style={{ margin: "12px 16px 0", borderRadius: "12px", padding: "14px 16px", display: "flex", gap: "12px", alignItems: "flex-start", backgroundColor: recBg, border: `1px solid ${recBorder}` }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: recIconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "18px" }}>
            {rec.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "9px", letterSpacing: "2px", color: recTagColor, marginBottom: "2px" }}>{rec.tag}</p>
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "15px", color: "#0A0908", marginBottom: "3px", letterSpacing: "0.5px" }}>{rec.title}</p>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", fontWeight: 500, color: "#6B7280", marginBottom: "8px", lineHeight: 1.4 }}>{rec.desc}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {rec.pills.map(pill => (
                <span key={pill} style={{ backgroundColor: recPillBg, color: recTagColor, fontFamily: "'Bebas Neue', sans-serif", fontSize: "9px", letterSpacing: "1px", borderRadius: "99px", padding: "3px 8px" }}>{pill}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Section 4: Hourly Forecast ── */}
      <div>
        <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "10px", letterSpacing: "2.5px", ...muted, padding: "14px 20px 8px" }}>NEXT 12 HOURS</p>
        <div style={{ display: "flex", overflowX: "auto", padding: "0 20px 16px", gap: "6px", scrollbarWidth: "none" }}>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Shimmer key={i} w={64} h={90} style={{ flexShrink: 0, borderRadius: "10px" }} />
            ))
          ) : error ? (
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "12px", color: "#C41101" }}>Gagal memuat data cuaca</p>
          ) : (
            (weather?.hourly ?? []).map((h, i) => {
              const isNow = h.time === currentHourLabel || (i === 0 && !(weather?.hourly ?? []).find(x => x.time === currentHourLabel));
              const cellAqiColor = h.aqi == null ? null : h.aqi <= 100 ? "#22C55E" : h.aqi <= 150 ? "#EAB308" : "#EF4444";
              const cellAqiBg = h.aqi == null ? null : h.aqi <= 100 ? "rgba(34,197,94,0.15)" : h.aqi <= 150 ? "rgba(234,179,8,0.15)" : "rgba(239,68,68,0.15)";

              return (
                <div
                  key={h.time}
                  className={isNow ? "hourly-cell hourly-cell-now" : "hourly-cell"}
                  style={{
                    flexShrink: 0,
                    width: "64px",
                    borderRadius: "10px",
                    padding: "10px 6px",
                    textAlign: "center",
                    backgroundColor: isNow ? "#0A0908" : "var(--card2)",
                    border: `0.5px solid ${isNow ? "#0A0908" : "var(--border-subtle)"}`,
                  }}
                >
                  <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "10px", letterSpacing: "1.5px", color: isNow ? "rgba(255,255,255,.5)" : "var(--muted)", marginBottom: "5px" }}>
                    {isNow ? "NOW" : h.time}
                  </p>
                  <p style={{ fontSize: "18px", marginBottom: "4px" }}>{h.icon}</p>
                  <p style={{ fontFamily: "'Orbitron', monospace", fontSize: "13px", fontWeight: 700, color: isNow ? "#fff" : "var(--text)", marginBottom: "4px" }}>{h.temp}°</p>
                  {h.aqi != null && cellAqiColor && cellAqiBg && (
                    <span style={{ backgroundColor: cellAqiBg, color: cellAqiColor, fontFamily: "'Bebas Neue', sans-serif", fontSize: "9px", borderRadius: "4px", padding: "1px 5px", letterSpacing: "0.5px" }}>
                      {h.aqi}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Section 5: Timestamp ── */}
      {!loading && !error && (
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", ...muted, textAlign: "right", padding: "0 20px 14px" }}>
          Updated {minAgo < 1 ? "just now" : `${minAgo} min ago`} · Geolocation
        </p>
      )}
    </div>
  );
}
