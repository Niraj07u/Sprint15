import { generateWorkspaceSummary } from "../services/aiService.js";
import { logger } from "../utils/logger.js";

export async function handleWorkspaceSummary(request, response) {
  const { metrics, items } = request.body ?? {};

  // Request validation
  if (!metrics || typeof metrics !== "object" || !Array.isArray(items)) {
    return response.status(400).json({
      success: false,
      message: "A valid workspace snapshot containing metrics and items array is required.",
    });
  }

  // Payload protection against oversized requests
  if (items.length > 100) {
    return response.status(400).json({
      success: false,
      message: "Snapshot exceeds maximum allowed items count (100).",
    });
  }

  try {
    const result = await generateWorkspaceSummary({ metrics, items });
    return response.status(200).json(result);
  } catch (error) {
    logger.error(`AI summary generation error: ${error.message}`);
    return response.status(500).json({
      success: false,
      message: "An error occurred while generating the operational summary.",
    });
  }
}
