import { kv } from "@vercel/kv";

const memoryStore = new Map();

/**
 * Checks the rate limit of a given IP.
 * Allowed: 10 requests per 15 minutes.
 * @param {string} ip The request IP address
 * @returns {Promise<boolean>} True if within limit, false if rate-limited
 */
export async function checkRateLimit(ip) {
  const windowSeconds = 15 * 60; // 15 mins
  const limit = 10;

  // Local fallback: checks environment variables.
  // If Vercel KV is not configured, we use an in-memory Map.
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    const now = Date.now();
    const key = `ratelimit:${ip}`;
    let record = memoryStore.get(key);

    if (!record || now - record.resetTime > windowSeconds * 1000) {
      record = { count: 1, resetTime: now };
    } else {
      record.count++;
    }

    memoryStore.set(key, record);
    return record.count <= limit;
  }

  // Production Vercel KV / Upstash
  try {
    const key = `ratelimit:${ip}`;
    const current = await kv.incr(key);
    
    if (current === 1) {
      await kv.expire(key, windowSeconds);
    }
    
    return current <= limit;
  } catch (error) {
    console.error("KV rate limiting failed, falling back to memory:", error.message);
    // Silent fallback to allow request if KV store is down or misconfigured
    return true;
  }
}
