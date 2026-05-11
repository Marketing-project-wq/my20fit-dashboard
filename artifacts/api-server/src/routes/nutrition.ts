import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

interface McuData {
  grade?: string;
  summary?: string;
  metrics?: unknown;
  doctor_notes?: string;
}

interface WellnessData {
  mood?: number;
  energy?: number;
  stress?: number;
  soreness?: string;
}

interface SleepData {
  bed?: string;
  wake?: string;
  hours?: number;
  quality?: string;
}

interface WaterData {
  logs?: { ml: number }[];
  totalL?: number;
  target?: number;
}

interface WorkoutItem {
  type: string;
  duration: number;
  date: string;
}

router.post("/nutrition-recommendation", async (req, res): Promise<void> => {
  try {
    const {
      mcuData,
      wellnessData,
      sleepData,
      waterData,
      workoutData,
    }: {
      mcuData?: McuData;
      wellnessData?: WellnessData;
      sleepData?: SleepData;
      waterData?: WaterData;
      workoutData?: WorkoutItem[];
    } = req.body;

    const now = new Date();
    const hour = now.getHours();
    const timeContext =
      hour < 10 ? "pagi (sarapan)" :
      hour < 13 ? "siang (makan siang)" :
      hour < 16 ? "sore (snack)" :
      hour < 20 ? "malam (makan malam)" : "malam (camilan ringan)";

    req.log.info({ hour, timeContext }, "Generating nutrition recommendation");

    const prompt = `Kamu adalah ahli gizi dan nutrisi olahraga untuk 20FIT Sport Clinic Indonesia.
Berikan rekomendasi makanan harian yang sangat personal berdasarkan data kesehatan berikut.
Jawab HANYA dengan JSON valid, tanpa markdown, tanpa teks lain.

DATA PENGGUNA:
${mcuData ? `
MCU Results:
- Grade: ${mcuData.grade}
- Summary: ${mcuData.summary}
- Metrics: ${JSON.stringify(mcuData.metrics)}
- Doctor notes: ${mcuData.doctor_notes}
` : "MCU: Belum ada data MCU"}

${wellnessData ? `
Kondisi hari ini:
- Mood: ${wellnessData.mood}/5
- Energy: ${wellnessData.energy}/10
- Stress: ${wellnessData.stress}/10
- Muscle soreness: ${wellnessData.soreness}
` : "Wellness: Belum check-in hari ini"}

${sleepData ? `
Tidur semalam: ${sleepData.hours} jam (${sleepData.quality ?? "tidak diketahui"})
` : "Tidur: Tidak ada data"}

${waterData ? `
Asupan air hari ini: ${waterData.totalL ?? 0}L dari target ${waterData.target ?? 2.5}L
` : "Air: Belum ada data"}

${workoutData && workoutData.length > 0 ? `
Workout minggu ini: ${workoutData.map(w => `${w.type} ${w.duration} menit`).join(", ")}
` : "Workout: Tidak ada data minggu ini"}

Waktu sekarang: ${timeContext}

Berikan rekomendasi dalam format JSON ini:
{
  "date": "${now.toISOString().split("T")[0]}",
  "overall_goal": "1 kalimat goal nutrisi hari ini berdasarkan kondisi user",
  "calorie_estimate": {
    "target": number,
    "breakdown": { "protein": "Xg", "carbs": "Xg", "fat": "Xg" },
    "note": "penjelasan singkat"
  },
  "meals": [
    {
      "time": "Sarapan",
      "time_range": "06:00 - 09:00",
      "emoji": "🌅",
      "suggestions": [
        { "name": "nama makanan", "portion": "porsi", "calories": number, "tags": ["Protein Tinggi"] }
      ],
      "avoid": ["makanan yang harus dihindari"],
      "reason": "alasan spesifik berdasarkan data user"
    },
    {
      "time": "Makan Siang",
      "time_range": "11:00 - 13:00",
      "emoji": "☀️",
      "suggestions": [],
      "avoid": [],
      "reason": ""
    },
    {
      "time": "Snack Sore",
      "time_range": "15:00 - 16:00",
      "emoji": "🍎",
      "suggestions": [],
      "avoid": [],
      "reason": ""
    },
    {
      "time": "Makan Malam",
      "time_range": "18:00 - 20:00",
      "emoji": "🌙",
      "suggestions": [],
      "avoid": [],
      "reason": ""
    }
  ],
  "hydration": {
    "target_l": number,
    "current_l": number,
    "remaining_l": number,
    "reminder": "pesan reminder hidrasi yang personal"
  },
  "supplements": [
    { "name": "nama suplemen", "dose": "dosis", "timing": "waktu konsumsi", "reason": "alasan" }
  ],
  "foods_to_avoid_today": [
    { "food": "nama makanan", "reason": "alasan spesifik dari data MCU/kondisi hari ini" }
  ],
  "insight": "1-2 kalimat insight nutrisi menarik berdasarkan kondisi user hari ini"
}`;

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find(b => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      req.log.error("No text block in Claude nutrition response");
      res.status(500).json({ success: false, error: "AI response was empty" });
      return;
    }

    let cleaned = textBlock.text.replace(/```json|```/g, "").trim();

    // Recover from truncated JSON by closing open structures
    if (!cleaned.endsWith("}")) {
      const lastBrace = cleaned.lastIndexOf("}");
      if (lastBrace > 0) cleaned = cleaned.slice(0, lastBrace + 1);
      // Close any unclosed arrays/objects at root level
      const opens = (cleaned.match(/\[/g) || []).length - (cleaned.match(/\]/g) || []).length;
      const braces = (cleaned.match(/\{/g) || []).length - (cleaned.match(/\}/g) || []).length;
      for (let i = 0; i < opens; i++) cleaned += "]";
      for (let i = 0; i < braces; i++) cleaned += "}";
    }

    const result = JSON.parse(cleaned);

    req.log.info({ date: result.date }, "Nutrition recommendation generated");
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error({ err }, "Nutrition recommendation error");
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;
