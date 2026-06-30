import { genAI, SYSTEM_INSTRUCTIONS } from "../lib/gemini.js";
import { verifyToken } from "../lib/auth.js";
import { checkRateLimit } from "../lib/rateLimit.js";
import { sanitizeChenCodeResponse } from "../lib/sanitize.js";

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // 1. Verify Authentication Token
  try {
    await verifyToken(req);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  // 2. Apply Rate Limiting
  const ip = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "127.0.0.1";
  const withinLimit = await checkRateLimit(ip);
  if (!withinLimit) {
    return res.status(429).json({
      error: "Too many requests from this IP. Please try again after 15 minutes (Free Tier Protection)."
    });
  }

  // 3. Process Request
  const { requirements } = req.body || {};
  if (!requirements || typeof requirements !== "string") {
    return res.status(400).json({ error: "Requirements string is required." });
  }

  if (!genAI) {
    return res.status(500).json({ error: "Gemini API client is not configured on the server." });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: SYSTEM_INSTRUCTIONS,
    });

    const prompt = `Generate Chen Code ER Diagram for these requirements: ${requirements}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawCode = response.text();

    const sanitizedCode = sanitizeChenCodeResponse(rawCode);

    return res.status(200).json({ chenCode: sanitizedCode });
  } catch (error) {
    console.error("Gemini text generation failed:", error);
    return res.status(500).json({ error: "Failed to generate Chen Code from text requirements." });
  }
}
