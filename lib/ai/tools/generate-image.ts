import { tool } from "ai";
import { z } from "zod";
import { asi1GenerateImage } from "@/lib/asi1/client";

/**
 * Lets the chat model generate an image with the Gemini image API.
 *
 * Returns a public URL (or base64 fallback) the UI can render inline. Keep
 * the tool description concrete so the model only reaches for it when the
 * user explicitly asks for a generated image, not for every illustration.
 */
export const generateImageTool = tool({
  description: [
    "Generate a realistic, high-quality image with Gemini 3 Pro Image",
    "(gemini-3-pro-image-preview).",
    "Call this ONLY when the user explicitly asks to create, generate, draw,",
    "or design an image, illustration, mockup, banner, or visual asset.",
    "Do not call it for charts, plots, diagrams, or data visualizations.",
    "Pass a detailed prompt (subject, style, layout, palette, mood) and an",
    "optional topic for sharper technical styling.",
  ].join(" "),
  inputSchema: z.object({
    prompt: z
      .string()
      .min(3)
      .max(2000)
      .describe(
        "Detailed image prompt: subject, style, palette, composition, mood."
      ),
    topic: z
      .string()
      .min(1)
      .max(200)
      .optional()
      .describe(
        "Short subject label (e.g. MCP servers, API docs) for enhanced technical styling."
      ),
    size: z
      .enum(["256x256", "512x512", "1024x1024", "1024x1792", "1792x1024"])
      .default("1792x1024")
      .describe(
        "Output resolution. Default 1792x1024 (16:9 YouTube thumbnail)."
      ),
  }),
  execute: async ({ prompt, topic, size }) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return {
          ok: false,
          error:
            "Image generation is not configured (GEMINI_API_KEY missing on this deployment).",
        };
      }
      const { images } = await asi1GenerateImage({ prompt, topic, size });
      const first = images.at(0);
      if (!first) {
        return {
          ok: false,
          error: "The image model returned no image for this prompt.",
        };
      }
      return {
        ok: true,
        prompt,
        size,
        url: first.url ?? null,
        b64Json: first.b64Json ?? null,
        revisedPrompt: first.revisedPrompt ?? null,
      };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error ? error.message : "Image generation failed.",
      };
    }
  },
});
