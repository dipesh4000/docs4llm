const THUMBNAIL_STYLES = [
  "photorealistic YouTube thumbnail — studio-lit hero subject, ultra-sharp static frame",
  "cinematic 4K still — dramatic lighting, shallow depth of field, no motion blur",
  "hyper-real product-shot aesthetic — crisp edges, glossy highlights, magazine cover quality",
  "bold MrBeast-style thumbnail energy — saturated colors, massive visual impact, one clear focal point",
  "MKBHD-style tech thumbnail — clean dark backdrop, neon accent glow, premium realism",
  "Veritasium-style educational thumbnail — photoreal scene + subtle 3D element, high clarity",
  "Ali Abdaal-style clean thumbnail — bright, optimistic, professional photography look",
  "high-contrast gaming thumbnail — vivid RGB accents, dark vignette, razor-sharp details",
  "documentary-style realistic still — natural light, authentic textures, National Geographic polish",
  "luxury brand commercial still — soft box lighting, rich shadows, 8K static photograph",
] as const;

const THUMBNAIL_PALETTES = [
  "electric blue + deep black + white highlights (classic tech thumbnail)",
  "fire orange + charcoal gray + yellow pop accent (high CTR warmth)",
  "neon green + midnight purple + white glow (gaming / dev energy)",
  "crimson red + dark navy + gold accent (urgency + premium)",
  "sunset orange-to-magenta gradient backdrop + dark foreground subject",
  "teal cyan + coral pink split-tone (modern creator palette)",
  "pure white backdrop + single bold accent color (minimal click-bait clean)",
  "dark moody background + single saturated subject color (spotlight effect)",
  "golden hour warm tones + deep shadow contrast (cinematic realism)",
  "cool steel blue + silver chrome + bright white rim light (futuristic tech)",
] as const;

const THUMBNAIL_LAYOUTS = [
  "hero subject fills 60% of frame on the right, negative space on the left for title overlay",
  "centered hero object with radial glow behind it, symmetrical punch",
  "rule-of-thirds — subject on left third, dramatic empty space on right",
  "close-up face or object cropped tight, background heavily blurred (bokeh)",
  "before/after split frame with clean vertical divider",
  "subject emerging from bottom edge, sky/gradient top half (epic scale)",
  "isometric product floating center with soft shadow beneath (3D realism)",
  "over-shoulder perspective looking at screen/dashboard (POV thumbnail)",
] as const;

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}

function deriveTopic(prompt: string, topic?: string): string {
  const trimmedTopic = topic?.trim();
  if (trimmedTopic) {
    return trimmedTopic;
  }

  const firstLine = prompt.split("\n").at(0)?.trim() ?? prompt.trim();
  if (firstLine.length <= 80) {
    return firstLine;
  }

  return firstLine.slice(0, 77).trimEnd().concat("...");
}

/**
 * Expand a user prompt into a YouTube-thumbnail-style brief so Gemini 3 Pro
 * Image returns photorealistic, static, high-CTR visuals.
 */
export function enhanceImagePrompt(prompt: string, topic?: string): string {
  const subject = deriveTopic(prompt, topic);
  const style = pickRandom(THUMBNAIL_STYLES);
  const palette = pickRandom(THUMBNAIL_PALETTES);
  const layout = pickRandom(THUMBNAIL_LAYOUTS);

  return `Create a STATIC, photorealistic YouTube thumbnail image about "${subject}".

Original prompt: ${prompt}

THUMBNAIL DIRECTION (must look like a real top-creator YouTube thumbnail):
- Visual style: ${style}
- Color palette: ${palette}
- Layout: ${layout}
- ONE clear hero subject related to "${subject}" — instantly readable at small size
- Photorealistic or hyper-real 3D render — NOT flat illustration, NOT cartoon, NOT sketch
- Static single frame — absolutely NO motion blur, NO animation frames, NO comic panels
- Ultra-sharp 2K detail — pores, textures, reflections, and edges must look real
- Cinematic studio lighting: key light + rim light + controlled shadows
- High saturation and contrast so it pops in a YouTube feed grid
- Clean background (gradient, blur, or solid) — subject must not blend into backdrop
- Leave subtle negative space where a title could go (do NOT render text unless the original prompt asks for text)
- Professional, click-worthy, premium creator aesthetic

REALISM REQUIREMENTS:
- Looks like a real photograph or Unreal Engine 5 render still
- Correct anatomy, perspective, and lighting if people or objects appear
- Real-world materials: metal, glass, skin, fabric must look tactile
- Depth of field optional but background must stay readable, not noisy
- Color grading like a finished YouTube upload — vibrant but not oversaturated mush

AVOID:
- Flat vector art, clipart, emoji style, or Excalidraw/sketch look
- Busy collage, too many small elements, or illegible clutter
- Watermarks, logos, or UI chrome unless explicitly requested
- Washed-out low-contrast images
- Generic stock-photo stiffness — aim for deliberate creator thumbnail energy
- Animated / GIF / multi-panel / comic-book layouts
- LinkedIn corporate infographic or slide-deck aesthetic

SUBJECT FOCUS for "${subject}":
- Choose the most visually dramatic, thumbnail-friendly angle of the topic
- Use a bold visual metaphor that communicates the topic in under 1 second
- Make it feel like the still frame someone would click on YouTube at 1280×720 scale`;
}
