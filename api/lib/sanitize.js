/**
 * Cleans markdown formatting, code fences, and labels from generative AI output.
 * @param {string} text 
 * @returns {string} Sanitized Chen code DSL
 */
export const sanitizeChenCodeResponse = (text) => {
  if (!text) return "";
  let cleaned = text.trim();
  // Remove markdown code blocks starting with ```chen or similar
  cleaned = cleaned.replace(/^```[a-zA-Z]*\s*\n?/i, "");
  // Remove closing markdown code fences
  cleaned = cleaned.replace(/\n?\s*```$/, "");
  // Remove leading labels like "Chen Code:" or "Code:"
  cleaned = cleaned.replace(/^(Chen Code|Code):\s*\n?/i, "");
  return cleaned.trim();
};
export default sanitizeChenCodeResponse;
