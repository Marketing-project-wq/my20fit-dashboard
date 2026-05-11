import { Router, type IRouter } from "express";
import multer from "multer";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
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

  const isImage = mimetype === "image/jpeg" || mimetype === "image/png";
  const base64Data = buffer.toString("base64");

  // ── STEP 1: Validate document with Claude pre-check ──
  try {
    const validationPrompt = `Look at this document carefully.
Answer with JSON only, no other text:
{
  "is_mcu": true or false,
  "confidence": 0-100,
  "document_type": "what this document actually is",
  "patient_name": "name found in document or null",
  "has_required_fields": true or false,
  "missing_fields": ["list of missing required fields"],
  "reason": "brief explanation in Bahasa Indonesia"
}

Required fields for a valid MCU: patient name, examination date, and at least 3 of these: blood pressure, cholesterol, blood sugar, BMI, hemoglobin, heart rate, body weight.`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validationContent: any[] = [
      isImage
        ? {
            type: "image",
            source: {
              type: "base64",
              media_type: mimetype as "image/jpeg" | "image/png",
              data: base64Data,
            },
          }
        : {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64Data,
            },
          },
      { type: "text", text: validationPrompt },
    ];

    const validationResponse = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 300,
      messages: [{ role: "user", content: validationContent }],
    });

    const validationText = validationResponse.content.find((b) => b.type === "text");
    let validationResult: {
      is_mcu: boolean;
      confidence: number;
      document_type: string;
      patient_name: string | null;
      has_required_fields: boolean;
      missing_fields: string[];
      reason: string;
    } = {
      is_mcu: false,
      confidence: 0,
      document_type: "Unknown",
      patient_name: null,
      has_required_fields: false,
      missing_fields: [],
      reason: "Gagal membaca dokumen",
    };

    if (validationText && validationText.type === "text") {
      try {
        const raw = validationText.text.replace(/```json|```/g, "").trim();
        validationResult = JSON.parse(raw);
      } catch {
        req.log.warn("Failed to parse validation JSON, defaulting to rejection");
      }
    }

    req.log.info({ is_mcu: validationResult.is_mcu, confidence: validationResult.confidence, document_type: validationResult.document_type }, "MCU validation result");

    if (!validationResult.is_mcu || validationResult.confidence < 60) {
      res.status(400).json({
        error: "not_mcu",
        document_type: validationResult.document_type,
        message: `Dokumen ini bukan hasil MCU. Terdeteksi: ${validationResult.document_type}. ${validationResult.reason}`,
      });
      return;
    }

    if (!validationResult.has_required_fields) {
      res.status(400).json({
        error: "incomplete_mcu",
        missing: validationResult.missing_fields,
        message: `Dokumen MCU tidak lengkap. Field yang tidak ditemukan: ${validationResult.missing_fields?.join(", ")}`,
      });
      return;
    }

    const detectedPatientName = validationResult.patient_name;

    // ── STEP 2: Full analysis ──
    const today = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let messageContent: any[];

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
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null, "location": "gym or home or clinic or null"},
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null, "location": "gym or home or clinic or null"},
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null, "location": "gym or home or clinic or null"},
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null, "location": "gym or home or clinic or null"},
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null, "location": "gym or home or clinic or null"}
  ],
  "doctor_notes": "Key medical findings in Bahasa Indonesia",
  "reviewed_at": "${today}"
}
Generate 5 personalized daily tasks based on the MCU results. Return only the JSON.`,
        },
      ];
    } else {
      messageContent = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64Data,
          },
        },
        {
          type: "text",
          text: `Analyze this MCU PDF document and return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "summary": "Brief 2-sentence overall health summary in Bahasa Indonesia",
  "grade": "A or B or C or D based on overall health",
  "metrics": [
    {"label": "metric name", "value": "value with unit", "status": "ok or high or low or warning", "note": "brief note"}
  ],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "checklist": [
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null, "location": "gym or home or clinic or null"},
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null, "location": "gym or home or clinic or null"},
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null, "location": "gym or home or clinic or null"},
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null, "location": "gym or home or clinic or null"},
    {"icon": "emoji", "title": "task title", "reason": "why this task", "priority": "high or med or low", "duration": null, "location": "gym or home or clinic or null"}
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

    let raw = textBlock.text.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
    }

    const result = JSON.parse(raw);
    result.patient_name = detectedPatientName;

    req.log.info({ grade: result.grade }, "MCU analysis complete");
    res.json(result);
  } catch (err) {
    logger.error({ err }, "MCU analysis error");
    res.status(500).json({ error: "AI analysis failed. Please try again." });
  }
});

export default router;
