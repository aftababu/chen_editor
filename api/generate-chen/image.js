import fs from "fs/promises";
import formidable from "formidable";
import { genAI, SYSTEM_INSTRUCTIONS } from "../lib/gemini.js";
import { verifyToken } from "../lib/auth.js";
import { checkRateLimit } from "../lib/rateLimit.js";
import { sanitizeChenCodeResponse } from "../lib/sanitize.js";

// Disable standard Vercel JSON parser to stream multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

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

  if (!genAI) {
    return res.status(500).json({ error: "Gemini API client is not configured on the server." });
  }

  // 3. Parse Multipart Form Upload via formidable
  try {
    const form = formidable({ multiples: false, keepExtensions: true });
    const [, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    const rawFile = files.image;
    const imageFile = Array.isArray(rawFile) ? rawFile[0] : rawFile;

    if (!imageFile) {
      return res.status(400).json({ error: "Image file is required." });
    }

    const filePath = imageFile.filepath || imageFile.path;
    const fileMimeType = imageFile.mimetype || imageFile.type;

    if (!fileMimeType.startsWith("image/")) {
      return res.status(400).json({ error: "Only image files are allowed." });
    }

    // Read the file data into buffer
    const fileBuffer = await fs.readFile(filePath);

    // Use gemini-2.5-flash for image understanding
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTIONS,
    });

    // Convert buffer to generative AI format
    const imagePart = {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType: fileMimeType,
      },
    };

    const prompt = "Read this ER diagram image and generate the corresponding Chen Code.";
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const rawCode = response.text();

    const sanitizedCode = sanitizeChenCodeResponse(rawCode);

    // Safely delete temp file from /tmp
    await fs.unlink(filePath).catch(() => {});

    return res.status(200).json({ chenCode: sanitizedCode });
  } catch (error) {
    console.error("Gemini image generation failed:", error);
    return res.status(500).json({ error: "Failed to generate Chen Code from image." });
  }
}
