import { useState, useEffect } from "react";

interface WeatherData {
  city: string;
  condition: string;
  temp: number;
  feels: number;
  humidity: number;
  uv: number;
  wind: number;
  aqi: number;
  aqiStatus: string;
}

const CACHE_KEY = "my20fit_weather_cache";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function pm25ToAqi(pm25: number): number {
  const bp: [number, number, number, number][] = [
    [0, 12, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 500.4, 301, 500],
  ];
  for (const [cLow, cHigh, iLow, iHigh] of bp) {
    if (pm25 >= cLow && pm25 <= cHigh) {
      return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (pm25 - cLow) + iLow);
    }
  }
  return 500;
}

function aqiToStatus(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

function aqiColor(aqi: number): string {
  if (aqi <= 50) return "#22C55E";
  if (aqi <= 100) return "#FFD700";
  if (aqi <= 150) return "#F97316";
  if (aqi <= 200) return "#C41101";
  if (aqi <= 300) return "#7C3AED";
  return "#831843";
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
  if (!apiKey) throw new Error("No API key");
  const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=yes`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WeatherAPI error ${res.status}`);
  const data = await res.json();

  const pm25 = data.current.air_quality?.pm2_5 ?? 0;
  const aqi = pm25ToAqi(pm25);

  return {
    city: data.location.name,
    condition: data.current.condition.text,
    temp: Math.round(data.current.temp_c),
    feels: Math.round(data.current.feelslike_c),
    humidity: data.current.humidity,
    uv: data.current.uv,
    wind: Math.round(data.current.wind_kph),
    aqi,
    aqiStatus: aqiToStatus(aqi),
  };
}

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded animate-pulse ${className}`}
      style={{ backgroundColor: "var(--card2)" }}
    />
  );
}

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Check cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
          setWeather(data);
          setLoading(false);
          return;
        }
      }
    } catch {
      // ignore bad cache
    }

    const load = async (lat: number, lon: number) => {
      try {
        const data = await fetchWeather(lat, lon);
        setWeather(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => load(pos.coords.latitude, pos.coords.longitude),
      () => load(-6.2088, 106.8456), // fallback: Jakarta
    );
  }, []);

  const color = weather ? aqiColor(weather.aqi) : "#FFD700";

  return (
    <div className="app-card mb-6 flex items-stretch gap-4" data-testid="card-weather">
      <div className="flex-1">
        <div className="flex items-start justify-between mb-3">
          <div>
            {loading ? (
              <>
                <Shimmer className="h-3 w-16 mb-1" />
                <Shimmer className="h-3 w-12 mt-1" />
              </>
            ) : (
              <>
                <p
                  className="uppercase mb-0.5"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "11px",
                    letterSpacing: "3px",
                    color: "var(--muted)",
                  }}
                >
                  {error ? "—" : weather?.city}
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--muted)", fontFamily: "'Barlow Condensed', system-ui" }}
                >
                  {error ? "—" : weather?.condition}
                </p>
              </>
            )}
          </div>

          {loading ? (
            <Shimmer className="h-12 w-20" />
          ) : (
            <div
              className="leading-none font-extrabold"
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "44px",
                fontWeight: 800,
                color: "var(--text)",
              }}
            >
              {error ? "—" : `${weather?.temp}°`}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Shimmer className="h-2.5 w-16" />
                  <Shimmer className="h-2.5 w-8" />
                </div>
              ))
            : [
                ["FEELS LIKE", error ? "—" : `${weather?.feels}°`],
                ["HUMIDITY", error ? "—" : `${weather?.humidity}%`],
                ["UV INDEX", error ? "—" : String(weather?.uv)],
                ["WIND", error ? "—" : `${weather?.wind} KM/H`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-center">
                  <span
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "10px",
                      letterSpacing: "2px",
                      color: "var(--muted)",
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {val}
                  </span>
                </div>
              ))}
        </div>
      </div>

      {/* AQI box */}
      <div
        className="w-[88px] rounded-xl flex flex-col items-center justify-center p-3 text-center shrink-0"
        style={{ backgroundColor: "#0A0908" }}
      >
        <span
          className="block mb-1"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "10px",
            letterSpacing: "3px",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          AQI
        </span>

        {loading ? (
          <>
            <Shimmer className="h-8 w-10 mb-1.5" />
            <Shimmer className="h-2.5 w-14" />
          </>
        ) : (
          <>
            <span
              className="block font-bold leading-none"
              style={{ fontFamily: "'Orbitron', monospace", fontSize: "28px", fontWeight: 700, color }}
            >
              {error ? "—" : weather?.aqi}
            </span>
            <span
              className="block mt-1.5"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "9px",
                letterSpacing: "1.5px",
                color,
                lineHeight: 1.2,
              }}
            >
              {error ? "N/A" : weather?.aqiStatus.toUpperCase()}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
