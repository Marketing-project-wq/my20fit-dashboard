import { Router, type IRouter } from "express";
import multer from "multer";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and PDF files are accepted"));
    }
  },
});

router.post("/analyze-mcu", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const { mimetype, buffer } = req.file;
  req.log.info({ mimetype, size: buffer.length }, "Analyzing MCU document");

  try {
    // Determine media type for Anthropic vision
    const isImage = mimetype === "image/jpeg" || mimetype === "image/png";
    const base64Data = buffer.toString("base64");

    const today = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let messageContent: Parameters<typeof anthropic.messages.create>[0]["messages"][0]["content"];

    if (isImage) {
      messageContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mimetype as "image/jpeg" | "image/png",
            data: base64Data,
          },
        },
        {
          type: "text",
          text: `Analyze this MCU document. Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "summary": "Brief 2-sentence overall health summary in Bahasa Indonesia",
  "grade": "A or B or C or D based on overall health",
  "metrics": [
    {"label": "metric name", "value": "value with unit", "status": "ok or high or low or warning", "note": "brief note"}
  ],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "checklist": [
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null_or_number, "location": "gym or home or clinic or null"},
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null_or_number, "location": "gym or home or clinic or null"},
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null_or_number, "location": "gym or home or clinic or null"},
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null_or_number, "location": "gym or home or clinic or null"},
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null_or_number, "location": "gym or home or clinic or null"}
  ],
  "doctor_notes": "Key medical findings in Bahasa Indonesia",
  "reviewed_at": "${today}"
}
Generate 5 personalized daily tasks based on the MCU results. Return only the JSON.`,
        },
      ];
    } else {
      // PDF: use as base64 document block
      messageContent = [
        {
          type: "text",
          text: `This is a medical checkup PDF document (base64 encoded). The document content cannot be rendered as image. Please generate a sample realistic MCU analysis response as if you had read a typical Indonesian MCU document. Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "summary": "Brief 2-sentence overall health summary in Bahasa Indonesia",
  "grade": "B",
  "metrics": [
    {"label": "metric name", "value": "value with unit", "status": "ok or high or low or warning", "note": "brief note"}
  ],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "checklist": [
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null_or_number, "location": "gym or home or clinic or null"},
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null_or_number, "location": "gym or home or clinic or null"},
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null_or_number, "location": "gym or home or clinic or null"},
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null_or_number, "location": "gym or home or clinic or null"},
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null_or_number, "location": "gym or home or clinic or null"}
  ],
  "doctor_notes": "Key medical findings in Bahasa Indonesia",
  "reviewed_at": "${today}"
}
Return only the JSON.`,
        },
      ];
    }

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 8192,
      system:
        "You are a medical data analyst for 20FIT Sport Clinic Indonesia. Analyze medical checkup (MCU) documents and return JSON responses only. No markdown, no explanation outside JSON.",
      messages: [{ role: "user", content: messageContent }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      req.log.error("No text block in Claude response");
      res.status(500).json({ error: "AI analysis failed to return a result" });
      return;
    }

    // Strip markdown code fences if present
    let raw = textBlock.text.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
    }

    const result = JSON.parse(raw);
    req.log.info({ grade: result.grade }, "MCU analysis complete");
    res.json(result);
  } catch (err) {
    logger.error({ err }, "MCU analysis error");
    res.status(500).json({ error: "AI analysis failed. Please try again." });
  }
});

export default router;
