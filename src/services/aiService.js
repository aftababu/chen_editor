/**
 * Sends a request to the backend to generate Chen Code from natural language text.
 * @param {string} requirements 
 * @param {string} idToken Firebase ID token
 * @returns {Promise<{ chenCode: string }>}
 */
export const generateChenCodeFromText = async (requirements, idToken) => {
  if (!idToken) {
    throw new Error("Authentication token is required.");
  }

  const response = await fetch("/api/generate-chen/text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ requirements }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate Chen Code from text.");
  }

  return response.json();
};

/**
 * Sends a request to the backend to generate Chen Code from an uploaded image.
 * @param {File} file The image file
 * @param {string} idToken Firebase ID token
 * @returns {Promise<{ chenCode: string }>}
 */
export const generateChenCodeFromImage = async (file, idToken) => {
  if (!idToken) {
    throw new Error("Authentication token is required.");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/generate-chen/image", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate Chen Code from image.");
  }

  return response.json();
};
