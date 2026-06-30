import admin from "./firebase.js";

/**
 * Verifies the Firebase Authorization ID token from the request headers.
 * @param {object} req Vercel Serverless request object
 * @returns {Promise<object>} Decoded token payload
 * @throws {Error} If unauthorized or invalid token
 */
export async function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized. No token provided.");
  }

  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Token verification failed:", error.message);
    throw new Error("Unauthorized. Invalid token.");
  }
}
